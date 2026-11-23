"""Sbewo: explicitly authorized Telegram Business event archive.
No MTProto login; no claim to recover prior deletions or restricted media.
"""
import os, json, hmac, hashlib, time, logging, base64, asyncio, re, html
from collections import defaultdict, deque
from threading import Lock
from datetime import datetime, timezone, timedelta
from urllib.parse import parse_qsl, quote
from contextlib import asynccontextmanager
from typing import Optional

import httpx
from cryptography.fernet import Fernet
from fastapi import FastAPI, Header, HTTPException, Request, Depends
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, Integer, BigInteger, DateTime, Boolean, ForeignKey, Text, UniqueConstraint, LargeBinary, select, delete, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, sessionmaker

logging.basicConfig(level=logging.INFO)
log=logging.getLogger('sbewo')
BOT_TOKEN=os.getenv('BOT_TOKEN','')
BOT_USERNAME=os.getenv('BOT_USERNAME','')
SECRET=os.getenv('WEBHOOK_SECRET','')
PUBLIC_URL=os.getenv('PUBLIC_URL','').rstrip('/')
FRONTEND_ORIGIN=os.getenv('FRONTEND_ORIGIN','').rstrip('/')
MAX_AGE=int(os.getenv('INITDATA_MAX_AGE_SECONDS','86400'))
# Internal snapshots are retained 30 days; event records are available for 7 days.
SNAPSHOT_DAYS=30
EVENT_DAYS=7
RETENTION=EVENT_DAYS
RATE_LIMIT=max(30,int(os.getenv('RATE_LIMIT_PER_MINUTE','180')))
_rate_lock=Lock()
_rate_buckets=defaultdict(deque)
MAX_MEDIA_BYTES=min(int(os.getenv('MAX_MEDIA_BYTES',str(6*1024*1024))),10*1024*1024)
URL=os.getenv('DATABASE_URL','sqlite:///./sbewo.db')
if URL.startswith('postgres://'): URL='postgresql+psycopg://'+URL[len('postgres://'):]
if URL.startswith('postgresql://'): URL='postgresql+psycopg://'+URL[len('postgresql://'):]
if not URL.startswith(('postgresql+psycopg://','sqlite:///')): raise RuntimeError('Unsupported DATABASE_URL')
key=os.getenv('DATA_ENCRYPTION_KEY','')
fernet=Fernet(key.encode()) if key else None
engine=create_engine(URL, pool_pre_ping=True,connect_args={'check_same_thread':False} if URL.startswith('sqlite:') else {})
SessionLocal=sessionmaker(engine,expire_on_commit=False)
class Base(DeclarativeBase):pass
class Connection(Base):
    __tablename__='connections'
    id:Mapped[str]=mapped_column(String(160),primary_key=True)
    owner_id:Mapped[int]=mapped_column(BigInteger,index=True)
    active:Mapped[bool]=mapped_column(Boolean,default=True)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
class AccessPeriod(Base):
    __tablename__='access_periods'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    trial_started_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
    paid_until:Mapped[Optional[datetime]]=mapped_column(DateTime(timezone=True),nullable=True)
    plan_months:Mapped[Optional[int]]=mapped_column(Integer,nullable=True)
    auto_renew:Mapped[bool]=mapped_column(Boolean,default=False)

class Message(Base):
    __tablename__='messages'
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    connection_id:Mapped[str]=mapped_column(String(160),index=True)
    owner_id:Mapped[int]=mapped_column(BigInteger,index=True)
    chat_id:Mapped[int]=mapped_column(BigInteger)
    message_id:Mapped[int]=mapped_column(BigInteger)
    chat_name:Mapped[str]=mapped_column(String(160),default='Чат')
    sender_name:Mapped[str]=mapped_column(String(160),default='Пользователь')
    # Stable sender ID is required to identify the account owner's own actions.
    sender_id:Mapped[Optional[int]]=mapped_column(BigInteger,nullable=True)
    chat_username:Mapped[Optional[str]]=mapped_column(String(80),nullable=True)
    kind:Mapped[str]=mapped_column(String(32),default='text')
    restricted_media:Mapped[bool]=mapped_column(Boolean,default=False,nullable=False)
    rescued_once:Mapped[bool]=mapped_column(Boolean,default=False,nullable=False)
    media_ttl_seconds:Mapped[Optional[int]]=mapped_column(Integer,nullable=True)
    text_encrypted:Mapped[Optional[str]]=mapped_column(Text,nullable=True)
    edited:Mapped[bool]=mapped_column(Boolean,default=False)
    deleted:Mapped[bool]=mapped_column(Boolean,default=False)
    # Deduplicate own deletions without marking them as the contact's deletes.
    own_deleted:Mapped[bool]=mapped_column(Boolean,default=False,nullable=False)
    # Only messages observed while full-archive opt-in was enabled are eligible
    # to appear as ordinary history. Monitoring snapshots remain private until
    # they become deletion/edit events, regardless of later toggle changes.
    archive_eligible:Mapped[bool]=mapped_column(Boolean,default=False,nullable=False)
    starred:Mapped[bool]=mapped_column(Boolean,default=False)
    note_encrypted:Mapped[Optional[str]]=mapped_column(Text,nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
    event_at:Mapped[Optional[datetime]]=mapped_column(DateTime(timezone=True),nullable=True)
    __table_args__=(UniqueConstraint('connection_id','chat_id','message_id',name='u_message'),)
class MessageKey(Base):
    """Independently destroyable data key per message, wrapped by an owner-specific KEK.

    A global wrapping secret is still required. Its backups and plaintext copies
    must be managed separately; deletion of this row removes the message DEK.
    """
    __tablename__='message_keys'
    message_row_id:Mapped[int]=mapped_column(ForeignKey('messages.id',ondelete='CASCADE'),primary_key=True)
    owner_id:Mapped[int]=mapped_column(BigInteger,index=True)
    wrapped_key:Mapped[bytes]=mapped_column(LargeBinary)

class SavedMedia(Base):
    __tablename__='saved_media'
    message_row_id:Mapped[int]=mapped_column(ForeignKey('messages.id',ondelete='CASCADE'),primary_key=True)
    mime_type:Mapped[str]=mapped_column(String(64))
    encrypted_bytes:Mapped[bytes]=mapped_column(LargeBinary)
    byte_count:Mapped[int]=mapped_column(Integer)
    file_name:Mapped[Optional[str]]=mapped_column(String(255),nullable=True)

class ChatAlias(Base):
    __tablename__='chat_aliases'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    chat_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    alias:Mapped[str]=mapped_column(String(160))

class ChatArchiveMode(Base):
    __tablename__='chat_archive_modes'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    chat_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    enabled:Mapped[bool]=mapped_column(Boolean,default=False)

class Revision(Base):
    __tablename__='revisions'
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    message_row_id:Mapped[int]=mapped_column(ForeignKey('messages.id',ondelete='CASCADE'),index=True)
    body_encrypted:Mapped[str]=mapped_column(Text)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
class Event(Base):
    __tablename__='events'
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    owner_id:Mapped[int]=mapped_column(BigInteger,index=True)
    message_row_id:Mapped[Optional[int]]=mapped_column(Integer,nullable=True)
    kind:Mapped[str]=mapped_column(String(24))
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
class InboxRead(Base):
    """Per-user read receipts for actual events and published announcements."""
    __tablename__='inbox_reads'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    notification_key:Mapped[str]=mapped_column(String(120),primary_key=True)
    read_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class Snippet(Base):
    __tablename__='snippets'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    tag:Mapped[str]=mapped_column(String(32),primary_key=True)
    body_encrypted:Mapped[str]=mapped_column(Text,nullable=False)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))

class ProcessedUpdate(Base):
    __tablename__='processed_updates'
    id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=lambda:datetime.now(timezone.utc))
class Preferences(Base):
    __tablename__='preferences'
    owner_id:Mapped[int]=mapped_column(BigInteger,primary_key=True)
    notify_delete:Mapped[bool]=mapped_column(Boolean,default=False)
    notify_edit:Mapped[bool]=mapped_column(Boolean,default=False)
    notify_group:Mapped[bool]=mapped_column(Boolean,default=False)
    notify_own_delete:Mapped[bool]=mapped_column(Boolean,default=False)
    notify_own_edit:Mapped[bool]=mapped_column(Boolean,default=False)
    started_bot:Mapped[bool]=mapped_column(Boolean,default=False)
    full_archive:Mapped[bool]=mapped_column(Boolean,default=False)

def enc(s):
    if not fernet: raise RuntimeError('DATA_ENCRYPTION_KEY must be configured')
    return fernet.encrypt((s or '').encode('utf-8')).decode('ascii')
def dec(s):
    if not s:return ''
    try:return fernet.decrypt(s.encode('ascii')).decode('utf-8') if fernet else ''
    except Exception:return '[не удалось расшифровать]'

def owner_wrapping_cipher(owner_id:int):
    # Different wrapping keys per Telegram account, deterministically derived
    # from the configured master secret. The master must remain in secure storage.
    raw=base64.urlsafe_b64decode(key.encode('ascii'))
    material=hmac.new(raw,b'sbewo-owner-key-v1:'+str(owner_id).encode('ascii'),hashlib.sha256).digest()
    return Fernet(base64.urlsafe_b64encode(material))

def record_cipher(db, m:Message, *, create=False):
    entry=db.get(MessageKey,m.id)
    if not entry and create:
        private_key=Fernet.generate_key()
        entry=MessageKey(message_row_id=m.id,owner_id=m.owner_id,
                         wrapped_key=owner_wrapping_cipher(m.owner_id).encrypt(private_key))
        db.add(entry)
        db.flush()
        return Fernet(private_key)
    if entry:
        return Fernet(owner_wrapping_cipher(m.owner_id).decrypt(entry.wrapped_key))
    # Existing records are migrated at startup. A safe legacy read fallback is
    # kept for deployments that cannot finish the migration in one boot.
    return fernet

def encrypted_text(db,m:Message,value:str)->str:
    return record_cipher(db,m,create=True).encrypt((value or '').encode()).decode('ascii')

def decrypted_text(db,m:Message,value)->str:
    if not value:return ''
    try:return record_cipher(db,m).decrypt(value.encode()).decode('utf-8')
    except Exception:return '[не удалось расшифровать]'

def encrypt_media(db,m:Message,content:bytes)->bytes:
    return record_cipher(db,m,create=True).encrypt(content)

def decrypt_media(db,m:Message,blob:bytes)->bytes:
    return record_cipher(db,m).decrypt(blob)

def migrate_legacy_record_keys():
    """Re-encrypt existing rows (text, notes, revisions and media) atomically.

    A record only gets its data key after every encrypted field migrates.
    Restart-safe; avoids falsely claiming crypto-shredding for legacy rows.
    """
    with SessionLocal.begin() as db:
        # Exclude rows already migrated. Re-run safely on each deploy.
        q=(select(Message).outerjoin(MessageKey,MessageKey.message_row_id==Message.id)
           .where(MessageKey.message_row_id.is_(None)).order_by(Message.id))
        for m in db.scalars(q).yield_per(200):
            raw_key=Fernet.generate_key()
            cipher=Fernet(raw_key)
            try:
                if m.text_encrypted:m.text_encrypted=cipher.encrypt(fernet.decrypt(m.text_encrypted.encode())).decode()
                if m.note_encrypted:m.note_encrypted=cipher.encrypt(fernet.decrypt(m.note_encrypted.encode())).decode()
                for r in db.scalars(select(Revision).where(Revision.message_row_id==m.id)):
                    r.body_encrypted=cipher.encrypt(fernet.decrypt(r.body_encrypted.encode())).decode()
                media=db.get(SavedMedia,m.id)
                if media:media.encrypted_bytes=cipher.encrypt(fernet.decrypt(media.encrypted_bytes))
            except Exception as exc:
                raise RuntimeError(f'Legacy data-key migration failed at message {m.id}') from exc
            db.add(MessageKey(message_row_id=m.id,owner_id=m.owner_id,
                    wrapped_key=owner_wrapping_cipher(m.owner_id).encrypt(raw_key)))
        db.flush()

def backfill_event_timestamps():
    """Preserve the 7-day window for already-observed events on migration."""
    with SessionLocal.begin() as db:
        rows=db.scalars(select(Message).where(Message.event_at.is_(None),
            (Message.deleted==True)|(Message.edited==True)|(Message.rescued_once==True))).all()
        for m in rows:
            when=db.scalar(select(func.max(Event.created_at)).where(Event.message_row_id==m.id))
            m.event_at=when or m.updated_at

def telegram_user(init_data: str)->int:
    if not BOT_TOKEN:raise HTTPException(503,'Bot is not configured')
    fields=dict(parse_qsl(init_data,keep_blank_values=True))
    given=fields.pop('hash','')
    if not given: raise HTTPException(401,'Telegram authorization required')
    sig='\n'.join(f'{k}={v}' for k,v in sorted(fields.items()))
    secret=hmac.new(b'WebAppData',BOT_TOKEN.encode(),hashlib.sha256).digest()
    expected=hmac.new(secret,sig.encode(),hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected,given):raise HTTPException(401,'Invalid Telegram signature')
    try:
        when=int(fields['auth_date'])
        if abs(time.time()-when)>MAX_AGE:raise ValueError('expired')
        uid=int(json.loads(fields['user'])['id'])
        if uid<=0:raise ValueError('bad user')
        return uid
    except (KeyError,ValueError,TypeError, json.JSONDecodeError):raise HTTPException(401,'Expired or invalid Telegram authorization')

class Auth(BaseModel):
    init_data:str
class UpdateNote(Auth):
    message_key:str
    note:str=Field(max_length=600)
class Mark(Auth):
    message_key:str
class AvatarRequest(Auth):
    chat_ids:list[int]=Field(default_factory=list,max_length=12)
class RenameChat(Auth):
    chat_id:int
    alias:str=Field(default='',max_length=160)

class ClearChatArchive(Auth):
    chat_id:int
    categories:list[str]=Field(min_length=1,max_length=4)

class NotifySettings(Auth):
    notify_delete:bool
    notify_edit:bool
    notify_group:bool=False
    notify_own_delete:bool=False
    notify_own_edit:bool=False

class InboxReadRequest(Auth):
    ids:list[str]=Field(default_factory=list,max_length=100)

def identify(body:Auth)->int:
    uid=telegram_user(body.init_data)
    now=time.monotonic()
    with _rate_lock:
        bucket=_rate_buckets[uid]
        while bucket and now-bucket[0]>=60: bucket.popleft()
        if len(bucket)>=RATE_LIMIT:raise HTTPException(429,'Слишком много запросов. Попробуй через минуту.')
        bucket.append(now)
        # Keep memory bounded when many distinct clients connect.
        if len(_rate_buckets)>10000:
            for key in list(_rate_buckets)[:1000]:
                if not _rate_buckets[key] or now-_rate_buckets[key][-1]>=60:_rate_buckets.pop(key,None)
    return uid
def clean_file_name(value):
    """Never expose supplied paths, control characters, or HTML in file names."""
    name=str(value or '').replace('\\','/').rsplit('/',1)[-1]
    name=''.join(ch for ch in name if ch.isprintable() and ch not in '\x00\r\n').strip(' .')[:240]
    return name or 'document'

def pack_message(db,m:Message,versions=None,media_saved=None,alias=None):
    return dict(key=str(m.id),chat_id=str(m.chat_id),chat=alias or m.chat_name,chat_username=m.chat_username or "",sender=m.sender_name,text=decrypted_text(db,m,m.text_encrypted),kind=m.kind,restricted_media=bool(m.restricted_media),rescued_once=bool(m.rescued_once),media_ttl_seconds=m.media_ttl_seconds,has_media=bool(media_saved),file_name=media_saved.file_name if media_saved else None,file_size=media_saved.byte_count if media_saved else None,deleted=m.deleted,edited=m.edited,starred=m.starred,note=decrypted_text(db,m,m.note_encrypted),time=int(m.created_at.replace(tzinfo=timezone.utc).timestamp()),updated=int(m.updated_at.replace(tzinfo=timezone.utc).timestamp()),versions=versions or [])

# Telegram webhook registration is part of the Render deploy lifecycle.
# This keeps callback_query / inline_query enabled without paid Render Shell.
TELEGRAM_ALLOWED_UPDATES = [
    'message', 'callback_query', 'inline_query', 'business_connection',
    'business_message', 'edited_business_message', 'deleted_business_messages',
]

async def configure_telegram_on_startup():
    """Register Telegram updates after startup, retrying transient API failures.

    Does not change the existing webhook if PUBLIC_URL is unset/invalid.
    Never prints bot tokens, Telegram request URLs or webhook secrets.
    """
    from urllib.parse import urlsplit

    if not PUBLIC_URL:
        log.warning('Telegram webhook auto-setup skipped: PUBLIC_URL is not set')
        return
    parsed = urlsplit(PUBLIC_URL)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        log.warning('Telegram webhook auto-setup skipped: PUBLIC_URL must be a public HTTPS base URL')
        return

    webhook_url = PUBLIC_URL + '/webhook/telegram'
    frontend_url = os.getenv('FRONTEND_URL', '').strip()
    frontend_ok = False
    if frontend_url:
        front = urlsplit(frontend_url)
        frontend_ok = bool(front.scheme == 'https' and front.hostname and
                           not front.username and not front.password and
                           not front.query and not front.fragment)
        if not frontend_ok:
            log.warning('Telegram menu button update skipped: invalid FRONTEND_URL')

    # Telegram API retries are bounded; the existing webhook remains active if
    # Telegram is temporarily unavailable. No pending updates are discarded.
    retry_delays = (0, 10, 30, 60, 120, 240)
    for attempt, delay in enumerate(retry_delays, 1):
        if delay:
            await asyncio.sleep(delay)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f'https://api.telegram.org/bot{BOT_TOKEN}/setWebhook',
                    json={
                        'url': webhook_url,
                        'secret_token': SECRET,
                        'allowed_updates': TELEGRAM_ALLOWED_UPDATES,
                        'drop_pending_updates': False,
                    },
                )
                result = response.json()
                if response.status_code != 200 or result.get('ok') is not True:
                    raise RuntimeError('Telegram rejected setWebhook')
                log.info('Telegram webhook configured (allowed updates: %s)',
                         ', '.join(TELEGRAM_ALLOWED_UPDATES))

                if frontend_ok:
                    try:
                        response = await client.post(
                            f'https://api.telegram.org/bot{BOT_TOKEN}/setChatMenuButton',
                            json={'menu_button': {
                                'type': 'web_app', 'text': 'Открыть Sbewo',
                                'web_app': {'url': frontend_url},
                            }},
                        )
                        menu_result = response.json()
                        if response.status_code != 200 or menu_result.get('ok') is not True:
                            raise RuntimeError('Telegram rejected menu update')
                        log.info('Telegram Mini App menu button configured')
                    except (httpx.HTTPError, ValueError, RuntimeError):
                        log.warning('Telegram menu button update failed; existing menu remains unchanged')
                else:
                    log.info('Telegram menu button unchanged (FRONTEND_URL not set)')
                return
        except (httpx.HTTPError, ValueError, RuntimeError):
            log.warning('Telegram webhook setup attempt %s/%s failed; retry pending',
                        attempt, len(retry_delays))

    log.error('Telegram webhook auto-setup failed after retries; review PUBLIC_URL, BOT_TOKEN and WEBHOOK_SECRET in Render')


@asynccontextmanager
async def lifespan(app):
    if not fernet or not BOT_TOKEN or not SECRET: raise RuntimeError('BOT_TOKEN, WEBHOOK_SECRET, DATA_ENCRYPTION_KEY required')
    Base.metadata.create_all(engine)
    # Inspect each table once; retain the same additive, non-destructive migrations.
    from sqlalchemy import inspect, text
    columns_to_add = {
        'preferences': (
            ('started_bot', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('notify_group', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('notify_own_delete', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('notify_own_edit', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('full_archive', 'BOOLEAN NOT NULL DEFAULT FALSE'),
        ),
        'saved_media': (('file_name', 'VARCHAR(255)'),),
        'messages': (
            ('chat_username', 'VARCHAR(80)'),
            ('rescued_once', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('restricted_media', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('media_ttl_seconds', 'INTEGER'),
            ('sender_id', 'BIGINT'),
            ('archive_eligible', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('own_deleted', 'BOOLEAN NOT NULL DEFAULT FALSE'),
            ('event_at', 'TIMESTAMP'),
        ),
    }
    inspector = inspect(engine)
    for table_name, definitions in columns_to_add.items():
        existing = {column['name'] for column in inspector.get_columns(table_name)}
        for column_name, definition in definitions:
            if column_name not in existing:
                with engine.begin() as conn:
                    conn.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}'))
                existing.add(column_name)
    # Keep the legacy encryption key until migration and backup retention have
    # completed; migration must not silently skip unreadable rows.
    await asyncio.to_thread(migrate_legacy_record_keys)
    await asyncio.to_thread(backfill_event_timestamps)
    await asyncio.to_thread(prune_expired)
    task=asyncio.create_task(retention_worker())
    webhook_setup_task=asyncio.create_task(configure_telegram_on_startup())
    try:
        yield
    finally:
        webhook_setup_task.cancel()
        task.cancel()
        for background_task in (webhook_setup_task, task):
            try: await background_task
            except asyncio.CancelledError: pass
app=FastAPI(title='Sbewo API',version='1.0.0',lifespan=lifespan,docs_url=None,redoc_url=None)
app.add_middleware(CORSMiddleware,allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN else [],allow_credentials=False,allow_methods=['POST','GET'],allow_headers=['Content-Type'])

@app.get('/health')
def health():return {'ok':True,'service':'sbewo','version':'1.0.0'}

def official_news():
    """Optional staff-published notices; no invented/default announcements."""
    try:
        entries=json.loads(os.getenv('SBEWO_NEWS_JSON','[]'))
        if not isinstance(entries,list):return []
        valid=[]
        for item in entries[:30]:
            if not isinstance(item,dict):continue
            code=str(item.get('id',''))
            if not re.fullmatch(r'[A-Za-z0-9_-]{1,60}',code):continue
            title=str(item.get('title','')).strip()[:120]
            body=str(item.get('body','')).strip()[:600]
            try:ts=int(item.get('published_at',0))
            except (TypeError,ValueError):continue
            if not title or not body or ts<=0 or ts>int(time.time())+60:continue
            valid.append({'id':'news:'+code,'category':'news','title':title,'body':body,'time':ts,'message_key':None})
        return valid
    except (ValueError,TypeError):
        log.warning('Invalid SBEWO_NEWS_JSON; ignoring announcements')
        return []

def inbox_items(db,uid):
    rows=db.execute(select(Event,Message).join(Message,Event.message_row_id==Message.id).where(
        Event.owner_id==uid,Message.owner_id==uid,Event.kind.in_(('edit','delete','capture'))
    ).order_by(Event.id.desc()).limit(100)).all()
    result=[]
    for event,msg in rows:
        kind=event.kind
        title={'edit':'Сообщение изменено','delete':'Сообщение удалено','capture':'Фото или медиа сохранено'}[kind]
        result.append({'id':f'event:{event.id}','category':kind,'title':title,
            'body':msg.chat_name or 'Чат','time':int(event.created_at.replace(tzinfo=timezone.utc).timestamp()),
            'message_key':str(msg.id)})
    result.extend(official_news())
    result.sort(key=lambda a:(a['time'],a['id']),reverse=True)
    return result[:100]

@app.post('/api/inbox')
def inbox(a:Auth):
    uid=identify(a)
    with SessionLocal() as db:
        items=inbox_items(db,uid)
        ids=[item['id'] for item in items]
        read=set(db.scalars(select(InboxRead.notification_key).where(
            InboxRead.owner_id==uid,InboxRead.notification_key.in_(ids))).all()) if ids else set()
        for item in items:item['unread']=item['id'] not in read
        return {'items':items,'unread_count':sum(item['unread'] for item in items)}

@app.post('/api/inbox/read')
def read_inbox(a:InboxReadRequest):
    uid=identify(a)
    requested=set(a.ids)
    if not requested:return {'ok':True,'marked':0}
    with SessionLocal.begin() as db:
        allowed={item['id'] for item in inbox_items(db,uid)}
        keys=requested&allowed
        old=set(db.scalars(select(InboxRead.notification_key).where(
            InboxRead.owner_id==uid,InboxRead.notification_key.in_(keys))).all()) if keys else set()
        for key in keys-old:db.add(InboxRead(owner_id=uid,notification_key=key))
        return {'ok':True,'marked':len(keys-old)}

def last_event_timestamp(db,uid):
    last=db.scalar(select(func.max(Event.created_at)).where(Event.owner_id==uid))
    return int(last.replace(tzinfo=timezone.utc).timestamp()) if last else None

@app.post('/api/overview')
def overview(a:Auth):
    uid=identify(a)
    with SessionLocal() as db:
        conn=db.scalars(select(Connection).where(Connection.owner_id==uid,Connection.active==True)).all()
        prefs=db.get(Preferences,uid)
        access=db.get(AccessPeriod,uid)
        if conn and access is None:
            # The first verified connection seen after deployment starts the trial.
            # Persistence prevents resets when the app is reopened or reconnected.
            access=AccessPeriod(owner_id=uid,trial_started_at=datetime.now(timezone.utc))
            db.add(access)
            db.commit()
        now_utc=datetime.now(timezone.utc)
        status='none'
        days_left=0
        trial_end=None
        paid_until=None
        if access is not None:
            from datetime import timedelta
            trial_end=access.trial_started_at.replace(tzinfo=timezone.utc)+timedelta(days=3)
            paid=access.paid_until.replace(tzinfo=timezone.utc) if access.paid_until else None
            if paid and paid>now_utc:
                status='paid'
                paid_until=paid.isoformat()
            elif trial_end>now_utc:
                import math
                status='trial'
                days_left=min(3,max(1,math.ceil((trial_end-now_utc).total_seconds()/86400)))
            else:status='expired'
        access_payload={'status':status,'days_left':days_left,'trial_ends_at':trial_end.isoformat() if trial_end else None,'paid_until':paid_until,'plan_months':access.plan_months if access else None,'auto_renew':bool(access and access.auto_renew)}
        q=select(Message).where(Message.owner_id==uid)
        # Snapshots remain server-side only for edit/delete detection.
        # Legacy full-archive preferences must never reveal ordinary messages.
        from sqlalchemy import or_
        events=or_(Message.deleted==True,Message.edited==True,Message.rescued_once==True)
        q=q.where(events)
        ms=db.scalars(q.order_by(Message.updated_at.desc()).limit(500)).all()
        ids=[m.id for m in ms]
        revisions=db.scalars(select(Revision).where(Revision.message_row_id.in_(ids)).order_by(Revision.created_at.asc(),Revision.id.asc())).all() if ids else []
        saved_media={s.message_row_id:s for s in db.scalars(select(SavedMedia).where(SavedMedia.message_row_id.in_(ids))).all()} if ids else {}
        aliases={a.chat_id:a.alias for a in db.scalars(select(ChatAlias).where(ChatAlias.owner_id==uid)).all()}
        known_usernames={}
        for row in ms:
            if row.chat_username:known_usernames[row.chat_id]=row.chat_username
        # One contact = one Telegram chat_id. Older rows may still contain a former name.
        # Prefer the latest non-placeholder name from the newest received message,
        # not the latest deletion/edit event (which may affect an old message).
        canonical_names={}
        for m in sorted(ms,key=lambda row:(row.created_at,row.id),reverse=True):
            candidate=(m.chat_name or '').strip()
            if m.chat_id not in canonical_names and candidate and candidate not in ('Личный чат','Чат без названия'):
                canonical_names[m.chat_id]=candidate
        ver={i:[] for i in ids}
        for r in revisions:ver[r.message_row_id].append({'text':decrypted_text(db,next(m for m in ms if m.id==r.message_row_id),r.body_encrypted),'time':int(r.created_at.replace(tzinfo=timezone.utc).timestamp())})
        return {'connected':bool(conn),'connections':len(conn),'access':access_payload,'aliases':{str(k):v for k,v in aliases.items()},'items':[dict(pack_message(db,m,ver[m.id],saved_media.get(m.id),aliases.get(m.chat_id)),chat=aliases.get(m.chat_id) or canonical_names.get(m.chat_id) or m.chat_name,chat_username=known_usernames.get(m.chat_id) or m.chat_username or "") for m in ms],'retention_days':EVENT_DAYS,'full_archive':False,'chat_full_archives':[],'buffer_hours':RETENTION*24,'notifications':{'delete':bool(prefs and prefs.notify_delete),'edit':bool(prefs and prefs.notify_edit),'group':bool(prefs and prefs.notify_group),'own_delete':bool(prefs and prefs.notify_own_delete),'own_edit':bool(prefs and prefs.notify_own_edit),'bot_started':bool(prefs and prefs.started_bot)},'last_event_at':last_event_timestamp(db,uid),'limits':{'media_download':True,'media_limit_bytes':MAX_MEDIA_BYTES,'group_deletions':False,'push_notifications':True,'payments':False}}

# --- Quick replies / snippets ---
SNIPPET_TAG=re.compile(r'^[a-z][a-z0-9_]{1,23}$')
SNIPPET_LIMIT=40

class SaveSnippet(Auth):
    tag:str=Field(min_length=2,max_length=24)
    body:str=Field(min_length=1,max_length=2000)

class DeleteSnippet(Auth):
    tag:str=Field(min_length=2,max_length=24)

@app.post('/api/snippets')
def list_snippets(a:Auth):
    uid=identify(a)
    with SessionLocal() as db:
        rows=db.scalars(select(Snippet).where(Snippet.owner_id==uid).order_by(Snippet.tag)).all()
        return {'items':[{'tag':r.tag,'body':dec(r.body_encrypted)} for r in rows]}

@app.post('/api/snippets/save')
def save_snippet(a:SaveSnippet):
    uid=identify(a)
    tag=a.tag.strip().lower().lstrip('/')
    if not SNIPPET_TAG.fullmatch(tag) or tag in ('start','dl','help'):
        raise HTTPException(400,'Тег: 2–24 латинских символа, цифры и _; начинается с буквы.')
    body=a.body.strip()
    if not body:raise HTTPException(400,'Текст не должен быть пустым')
    with SessionLocal.begin() as db:
        row=db.get(Snippet,(uid,tag))
        if row is None:
            n=db.scalar(select(func.count()).select_from(Snippet).where(Snippet.owner_id==uid)) or 0
            if n>=SNIPPET_LIMIT:raise HTTPException(400,'Максимум 40 шаблонов')
            row=Snippet(owner_id=uid,tag=tag,body_encrypted=enc(body));db.add(row)
        else:row.body_encrypted=enc(body);row.updated_at=datetime.now(timezone.utc)
    return {'ok':True,'tag':tag}

@app.post('/api/snippets/delete')
def delete_snippet(a:DeleteSnippet):
    uid=identify(a)
    with SessionLocal.begin() as db:
        row=db.get(Snippet,(uid,a.tag.lower().lstrip('/')))
        if row:db.delete(row)
    return {'ok':True}

@app.post('/api/chat-alias')
def set_chat_alias(a:RenameChat):
    uid=identify(a)
    alias=' '.join(a.alias.split()).strip()
    if len(alias)>160:raise HTTPException(422,'Название слишком длинное')
    with SessionLocal.begin() as db:
        allowed=db.scalar(select(Message.id).where(Message.owner_id==uid,Message.chat_id==a.chat_id).limit(1))
        if not allowed:raise HTTPException(404,'Чат не найден')
        entry=db.get(ChatAlias,(uid,a.chat_id))
        if not alias:
            if entry:db.delete(entry)
        elif entry:entry.alias=alias
        else:db.add(ChatAlias(owner_id=uid,chat_id=a.chat_id,alias=alias))
    return {'ok':True,'alias':alias,'chat_id':str(a.chat_id)}

@app.post('/api/notifications')
def update_notifications(a:NotifySettings):
    uid=identify(a)
    with SessionLocal.begin() as db:
        prefs=db.get(Preferences,uid)
        if not prefs:
            prefs=Preferences(owner_id=uid)
            db.add(prefs)
        prefs.notify_delete=a.notify_delete
        prefs.notify_edit=a.notify_edit
        prefs.notify_group=a.notify_group
        prefs.notify_own_delete=a.notify_own_delete
        prefs.notify_own_edit=a.notify_own_edit
        return {'delete':prefs.notify_delete,'edit':prefs.notify_edit,'group':prefs.notify_group,'own_delete':prefs.notify_own_delete,'own_edit':prefs.notify_own_edit,'bot_started':prefs.started_bot}

# Full conversation archiving and exporting have been removed deliberately.
# Only deletion/edit events and explicitly rescued media are visible.
def archive_visible(m, prefs=None, mode=None):
    return bool(m.deleted or m.edited or m.rescued_once)

@app.post('/api/media')
def media(a:Mark):
    uid=identify(a)
    with SessionLocal() as db:
        m=db.get(Message,int(a.message_key)) if a.message_key.isdecimal() else None
        if not m or m.owner_id!=uid:raise HTTPException(404,'Not found')
        prefs=db.get(Preferences,uid)
        mode=db.get(ChatArchiveMode,(uid,m.chat_id))
        if not archive_visible(m,prefs,mode):
            raise HTTPException(403,'Not in archive')
        blob=db.get(SavedMedia,m.id)
        if not blob:raise HTTPException(404,'Media is not available')
        try:content=decrypt_media(db,m,blob.encrypted_bytes)
        except Exception:raise HTTPException(500,'Media decryption failed')
        return {'mime':blob.mime_type,'base64':base64.b64encode(content).decode(),'bytes':blob.byte_count,'file_name':blob.file_name}

# Media is served as binary, not as a large base64 JSON payload. This avoids
# duplicating megabytes in Telegram's embedded WebView. URLs are scoped to one
# owner and message and expire after 5 minutes; access is verified again on GET.
MEDIA_LINK_TTL_SECONDS=300

def _media_signature(owner_id:int,message_id:int,expires:int)->str:
    payload=f'{owner_id}:{message_id}:{expires}'.encode('ascii')
    return hmac.new(BOT_TOKEN.encode('utf-8'),b'sbewo-media-v1:'+payload,hashlib.sha256).hexdigest()

def _authorized_media(db, owner_id:int, message_id:int):
    m=db.get(Message,message_id)
    if not m or m.owner_id!=owner_id:raise HTTPException(404,'Файл не найден')
    prefs=db.get(Preferences,owner_id)
    mode=db.get(ChatArchiveMode,(owner_id,m.chat_id))
    if not archive_visible(m,prefs,mode):
        raise HTTPException(403,'Файл недоступен в архиве')
    blob=db.get(SavedMedia,m.id)
    if not blob:raise HTTPException(404,'Сохранённый файл отсутствует')
    return m,blob

@app.post('/api/media-link')
def create_media_link(a:Mark):
    uid=identify(a)
    if not a.message_key.isdecimal():raise HTTPException(404,'Файл не найден')
    mid=int(a.message_key)
    with SessionLocal() as db:
        m,blob=_authorized_media(db,uid,mid)
        mime=blob.mime_type or 'application/octet-stream'
        filename=blob.file_name or ('sbewo-media'+('.png' if mime=='image/png' else '.bin'))
        expires=int(time.time())+MEDIA_LINK_TTL_SECONDS
        signature=_media_signature(uid,mid,expires)
        # A relative URL is resolved against API origin by the front end.
        url=f'/api/media-file?uid={uid}&mid={mid}&exp={expires}&sig={signature}'
        return {'url':url,'mime':mime,'file_name':filename,'bytes':blob.byte_count,'expires_at':expires}

@app.get('/api/media-file')
def download_media(uid:int,mid:int,exp:int,sig:str):
    if exp<int(time.time()) or exp>int(time.time())+MEDIA_LINK_TTL_SECONDS:
        raise HTTPException(403,'Ссылка на файл истекла')
    if not hmac.compare_digest(sig,_media_signature(uid,mid,exp)):
        raise HTTPException(403,'Некорректная ссылка на файл')
    with SessionLocal() as db:
        m,blob=_authorized_media(db,uid,mid)
        try:content=decrypt_media(db,m,blob.encrypted_bytes)
        except Exception:raise HTTPException(500,'Не удалось расшифровать файл')
        mime=blob.mime_type or 'application/octet-stream'
        inline=mime in ('image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/ogg','audio/mpeg','audio/mp4')
        filename=clean_file_name(blob.file_name or ('sbewo-image' if inline else 'sbewo-document'))
        ascii_name='sbewo-file'+('.'+filename.rsplit('.',1)[-1].lower() if '.' in filename and len(filename.rsplit('.',1)[-1])<12 else '')
        disposition=('inline' if inline else 'attachment')+f'; filename="{ascii_name}"; filename*=UTF-8\'\'{quote(filename)}'
        return Response(content,media_type=mime if inline else 'application/octet-stream',headers={
            'Content-Disposition':disposition,
            'Cache-Control':'private, no-store, max-age=0',
            'X-Content-Type-Options':'nosniff',
            'Referrer-Policy':'no-referrer',
            'Content-Security-Policy':"default-src 'none'; sandbox",
        })

class ChatProfileRequest(Auth):
    chat_id:int

@app.post('/api/chat-profile')
async def chat_profile(a:ChatProfileRequest):
    uid=identify(a)
    if a.chat_id<=0:raise HTTPException(400,'Invalid private chat ID')
    with SessionLocal() as db:
        item=db.scalar(select(Message).where(Message.owner_id==uid,Message.chat_id==a.chat_id).order_by(Message.created_at.desc()).limit(1))
        if not item:raise HTTPException(404,'Chat not found')
        fallback=item.chat_username or ''
    username=fallback
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp=await client.post(f'https://api.telegram.org/bot{BOT_TOKEN}/getChat',json={'chat_id':a.chat_id})
            payload=resp.json()
            if payload.get('ok') and isinstance(payload.get('result'),dict):
                username=str(payload['result'].get('username') or '').lstrip('@').strip()[:80]
    except (httpx.HTTPError,ValueError,TypeError,KeyError):
        pass
    return {'username':username}

@app.post('/api/chat-avatars')
async def chat_avatars(a:AvatarRequest):
    uid=identify(a)
    ids=list(dict.fromkeys(a.chat_ids))[:12]
    with SessionLocal() as db:
        allowed=set(db.scalars(select(Message.chat_id).where(Message.owner_id==uid,Message.chat_id.in_(ids)).distinct()).all())
    out={}
    # Bound concurrency to avoid a serial 3-request waterfall for every chat,
    # without opening excessive simultaneous connections to Telegram.
    semaphore=asyncio.Semaphore(4)
    async with httpx.AsyncClient(timeout=5) as client:
        async def load_avatar(cid):
            async with semaphore:
                try:
                    r=await client.post(f'https://api.telegram.org/bot{BOT_TOKEN}/getUserProfilePhotos',json={'user_id':cid,'limit':1})
                    obj=r.json()
                    photos=obj.get('result',{}).get('photos',[]) if obj.get('ok') else []
                    if not photos:return None
                    choice=photos[0][0]
                    if choice.get('file_size',0)>150000:return None
                    file_info=(await client.post(f'https://api.telegram.org/bot{BOT_TOKEN}/getFile',json={'file_id':choice['file_id']})).json()
                    fpath=file_info.get('result',{}).get('file_path') if file_info.get('ok') else None
                    if not fpath:return None
                    img=(await client.get(f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fpath}')).content
                    if len(img)<=150000 and img.startswith(b'\xff\xd8'):
                        return 'data:image/jpeg;base64,'+base64.b64encode(img).decode()
                except (httpx.HTTPError,ValueError,KeyError,TypeError):
                    log.debug('Avatar unavailable for chat %s',cid)
                return None

        valid_ids=[cid for cid in ids if cid in allowed and cid>0]
        results=await asyncio.gather(*(load_avatar(cid) for cid in valid_ids))
        out={str(cid):avatar for cid,avatar in zip(valid_ids,results) if avatar is not None}
    return {'avatars':out}

@app.post('/api/star')
def star(a:Mark):
    uid=identify(a)
    with SessionLocal.begin() as db:
        m=db.get(Message,int(a.message_key)) if a.message_key.isdecimal() else None
        if not m or m.owner_id!=uid:raise HTTPException(404,'Not found')
        m.starred=not m.starred
        return {'starred':m.starred}
@app.post('/api/note')
def note(a:UpdateNote):
    uid=identify(a)
    with SessionLocal.begin() as db:
        m=db.get(Message,int(a.message_key)) if a.message_key.isdecimal() else None
        if not m or m.owner_id!=uid:raise HTTPException(404,'Not found')
        m.note_encrypted=encrypted_text(db,m,a.note)
        return {'ok':True}
@app.post('/api/clear-chat')
def clear_chat(a:ClearChatArchive):
    uid=identify(a)
    selected=set(a.categories)
    if not selected or not selected.issubset({'all','deleted','edited','media'}):
        raise HTTPException(422,'Неверные типы событий')
    if not a.chat_id:
        raise HTTPException(422,'Не указан чат')
    with SessionLocal.begin() as db:
        query=select(Message.id).where(Message.owner_id==uid,Message.chat_id==a.chat_id)
        if 'all' not in selected:
            predicates=[]
            if 'deleted' in selected:predicates.append(Message.deleted==True)
            if 'edited' in selected:predicates.append(Message.edited==True)
            if 'media' in selected:predicates.append(Message.kind!='text')
            from sqlalchemy import or_
            query=query.where(or_(*predicates))
        ids=db.scalars(query).all()
        # Delete dependents explicitly; keep unrelated chats, connections and aliases.
        for offset in range(0,len(ids),400):
            chunk=ids[offset:offset+400]
            db.execute(delete(SavedMedia).where(SavedMedia.message_row_id.in_(chunk)))
            db.execute(delete(MessageKey).where(MessageKey.message_row_id.in_(chunk)))
            db.execute(delete(Revision).where(Revision.message_row_id.in_(chunk)))
            db.execute(delete(Event).where(Event.owner_id==uid,Event.message_row_id.in_(chunk)))
            db.execute(delete(Message).where(Message.owner_id==uid,Message.id.in_(chunk)))
    return {'ok':True,'deleted':len(ids)}

@app.post('/api/clear')
def clear(a:Auth):
    """Erase all chat content for this owner, retaining bot access and preferences."""
    uid=identify(a)
    deleted_count=0
    with SessionLocal.begin() as db:
        # Chunk to avoid SQLite's parameter limit and large SQL IN statements.
        while True:
            ids=db.scalars(select(Message.id).where(Message.owner_id==uid).limit(400)).all()
            if not ids:
                break
            db.execute(delete(SavedMedia).where(SavedMedia.message_row_id.in_(ids)))
            db.execute(delete(MessageKey).where(MessageKey.message_row_id.in_(ids)))
            db.execute(delete(Revision).where(Revision.message_row_id.in_(ids)))
            db.execute(delete(Event).where(Event.owner_id==uid,Event.message_row_id.in_(ids)))
            db.execute(delete(Message).where(Message.owner_id==uid,Message.id.in_(ids)))
            deleted_count += len(ids)
        # Also remove events whose messages were already purged by retention.
        db.execute(delete(Event).where(Event.owner_id==uid))
        db.execute(delete(ChatAlias).where(ChatAlias.owner_id==uid))
        db.execute(delete(ChatArchiveMode).where(ChatArchiveMode.owner_id==uid))
    return {'ok':True,'deleted':deleted_count}

async def telegram_send(chat_id:int,text:str):
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage',json={'chat_id':chat_id,'text':text})
    except Exception:log.exception('sendMessage failure')

def person_name(entity):
    return (entity.get('title') or ' '.join(filter(None,[entity.get('first_name'),entity.get('last_name')])) or entity.get('username') or 'Личный чат')[:160]

def re_full_mime(value):
    return bool(re.fullmatch(r'[a-z0-9][a-z0-9!#$&^_.+-]*/[a-z0-9][a-z0-9!#$&^_.+-]*',value))

def restricted_media_info(raw):
    """Only flags explicitly delivered to the Business Bot are used.

    MTProto TTL isn't normally included in Bot API BusinessMessage. Never
    infer view-once from the absence of a file_id or from a reply.
    """
    if not isinstance(raw,dict):return False,None
    ttl=raw.get('ttl_seconds')
    ttl=ttl if isinstance(ttl,int) and not isinstance(ttl,bool) and ttl>0 else None
    restricted=bool(raw.get('has_protected_content') or ttl is not None)
    return restricted,ttl

def media_descriptor(raw, *, reply_capture=False):
    """Return downloadable (file_id, MIME) candidates, best available first.

    Telegram can provide several photo sizes and sticker thumbnails. Prefer an
    actual image, and fall back to a smaller one if the download fails.
    """
    # Respect explicit restricted-content flags even if a file_id is present.
    if restricted_media_info(raw)[0] and not reply_capture:return []
    candidates=[]

    def append(item, mime):
        if not isinstance(item,dict):return
        file_id=item.get('file_id')
        size=item.get('file_size')
        if file_id and (not isinstance(size,int) or size<=MAX_MEDIA_BYTES):
            pair=(file_id,mime)
            if pair not in candidates:candidates.append(pair)

    if raw.get('photo'):
        photos=raw['photo']
        if isinstance(photos,list):
            for photo in reversed(photos):append(photo,'image/jpeg')
        return candidates

    sticker=raw.get('sticker')
    if isinstance(sticker,dict):
        if sticker.get('is_animated'):
            # TGS is a gzipped Lottie animation, not an HTML <img> format.
            # Keep the sticker visible via its Telegram thumbnail instead.
            append(sticker.get('thumbnail') or sticker.get('thumb'),'image/webp')
            append(sticker,'application/x-tgsticker')
        elif sticker.get('is_video'):
            append(sticker,'video/webm')
            append(sticker.get('thumbnail') or sticker.get('thumb'),'image/webp')
        else:
            append(sticker,'image/webp')
            append(sticker.get('thumbnail') or sticker.get('thumb'),'image/webp')
        return candidates

    if isinstance(raw.get('document'),dict):
        document=raw['document']
        mime=str(document.get('mime_type') or 'application/octet-stream').strip().lower()
        # Treat documents as downloads, not executable browser content.
        if len(mime)>64 or not re_full_mime(mime):mime='application/octet-stream'
        append(document,mime)
        return candidates

    for kind,mime in [('video','video/mp4'),('voice','audio/ogg'),('video_note','video/mp4'),('animation','video/mp4'),('audio','audio/mpeg')]:
        if raw.get(kind):
            append(raw[kind],mime)
            return candidates
    return candidates

async def fetch_media(raw, *, reply_capture=False):
    if restricted_media_info(raw)[0] and not reply_capture:return None
    candidates=media_descriptor(raw,reply_capture=reply_capture)
    if not candidates:return None
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            for file_id,mime in candidates:
                try:
                    resp=await client.post(f'https://api.telegram.org/bot{BOT_TOKEN}/getFile',json={'file_id':file_id})
                    resp.raise_for_status()
                    val=resp.json()
                    result=val.get('result',{}) if val.get('ok') else {}
                    fpath=result.get('file_path')
                    if not fpath or result.get('file_size',0)>MAX_MEDIA_BYTES:continue
                    # Stream and cap every file, even when Telegram omits file_size.
                    async with client.stream('GET',f'https://api.telegram.org/file/bot{BOT_TOKEN}/{fpath}') as stream:
                        if stream.status_code!=200:continue
                        chunks=[];total=0;too_big=False
                        async for chunk in stream.aiter_bytes():
                            total+=len(chunk)
                            if total>MAX_MEDIA_BYTES:
                                too_big=True
                                break
                            chunks.append(chunk)
                    if too_big:continue
                    blob=b''.join(chunks)
                    if blob:
                        # Telegram sticker thumbnails may be JPEG or WebP.
                        actual_mime=mime
                        if mime.startswith('image/'):
                            if blob.startswith(b'\xff\xd8\xff'):actual_mime='image/jpeg'
                            elif blob.startswith(b'\x89PNG\r\n\x1a\n'):actual_mime='image/png'
                            elif blob[:4]==b'RIFF' and blob[8:12]==b'WEBP':actual_mime='image/webp'
                        return (actual_mime,blob)
                except (httpx.HTTPError,ValueError,KeyError,TypeError):
                    # The largest photo may be unavailable, so try smaller sizes.
                    continue
    except httpx.HTTPError:
        pass
    log.info('Media could not be downloaded (kind=%s, candidates=%d)',next((k for k in ('photo','sticker','document','video','voice','video_note','animation','audio') if raw.get(k)),'other'),len(candidates))
    return None

def save_message(db,raw,edited=False,media=None):
    alerts=[]
    connection_id=raw.get('business_connection_id','')
    conn=db.get(Connection,connection_id)
    if not conn or not conn.active:return alerts
    chat=raw.get('chat') or {}
    # Only private chats; group-monitoring requires an independent permission model.
    if chat.get('type')!='private':return alerts
    cid=chat.get('id');mid=raw.get('message_id')
    if not isinstance(cid,int) or not isinstance(mid,int):return alerts
    m=db.scalar(select(Message).where(Message.connection_id==connection_id,Message.chat_id==cid,Message.message_id==mid))
    sender=raw.get('from') or {}
    sender_id=sender.get('id') if isinstance(sender.get('id'),int) else None
    # Only a real Telegram sender ID may identify the Business account owner.
    # Never guess from the display name, which can change or be duplicated.
    own_message=sender_id==conn.owner_id
    raw_username=str(chat.get('username') or '').lstrip('@').strip()[:80]
    # Telegram username is not the custom contact name and may be absent.
    # Keep the last observed username rather than fabricating one.
    if raw_username:
        db.query(Message).filter(Message.owner_id==conn.owner_id,Message.chat_id==cid).update({'chat_username':raw_username},synchronize_session='fetch')
    latest_name=person_name(chat)
    if latest_name!='Личный чат':
        # Update previously recorded display names without changing message IDs.
        # Only rename sender labels matching the previously seen chat name:
        # outgoing messages are authored by the account owner, not this contact.
        db.query(Message).filter(Message.owner_id==conn.owner_id,Message.chat_id==cid,Message.sender_name==Message.chat_name,Message.chat_name!=latest_name).update({Message.sender_name:latest_name},synchronize_session='fetch')
        db.query(Message).filter(Message.owner_id==conn.owner_id,Message.chat_id==cid,Message.chat_name!=latest_name).update({Message.chat_name:latest_name},synchronize_session='fetch')
    newtext=(raw.get('text') or raw.get('caption') or '')[:10000]
    kind=next((k for k in ('photo','video','voice','video_note','document','animation','audio','sticker') if k in raw),'text')
    restricted,ttl=restricted_media_info(raw)
    if restricted:media=None
    now=datetime.now(timezone.utc)
    document=raw.get('document') if isinstance(raw.get('document'),dict) else None
    filename=clean_file_name(document.get('file_name')) if document and document.get('file_name') else None
    if not m:
        # Decide eligibility at message arrival, never retroactively when a
        # subscriber later enables the archive toggle.
        prefs=db.get(Preferences,conn.owner_id)
        m=Message(archive_eligible=False,connection_id=connection_id,owner_id=conn.owner_id,chat_id=cid,message_id=mid,chat_name=latest_name,sender_name=person_name(sender),sender_id=sender_id,chat_username=raw_username or None,kind=kind,restricted_media=restricted,media_ttl_seconds=ttl,text_encrypted=None,created_at=now,updated_at=now,edited=(edited and not own_message),event_at=(now if edited and not own_message else None))
        db.add(m);db.flush()
        m.text_encrypted=encrypted_text(db,m,newtext)
        if media:db.add(SavedMedia(message_row_id=m.id,mime_type=media[0],encrypted_bytes=encrypt_media(db,m,media[1]),byte_count=len(media[1]),file_name=filename))
        if newtext:db.add(Revision(message_row_id=m.id,body_encrypted=encrypted_text(db,m,newtext),created_at=now))
        # Edited message received without original: original is not recoverable.
        if edited:
            if own_message:
                # Telegram may deliver an edit before the original message was observed.
                alerts.append((conn.owner_id,'own_edit',m.chat_name))
            else:
                db.add(Event(owner_id=conn.owner_id,message_row_id=m.id,kind='edit',created_at=now))
                alerts.append((conn.owner_id,'edit',m.chat_name))
    else:
        if raw_username:m.chat_username=raw_username
        # Backfill identity on the next observed edit/new-message update.
        if sender_id is not None:
            m.sender_id=sender_id
        own_message=m.sender_id==conn.owner_id
        old=decrypted_text(db,m,m.text_encrypted)
        if edited and (newtext!=old or kind!=m.kind):
            m.text_encrypted=encrypted_text(db,m,newtext);m.updated_at=now
            db.add(Revision(message_row_id=m.id,body_encrypted=encrypted_text(db,m,newtext),created_at=now))
            if own_message:
                alerts.append((conn.owner_id,'own_edit',m.chat_name))
            else:
                m.edited=True
                m.event_at=now
                db.add(Event(owner_id=conn.owner_id,message_row_id=m.id,kind='edit',created_at=now))
                alerts.append((conn.owner_id,'edit',m.chat_name))
        m.kind=kind
        m.restricted_media=bool(m.restricted_media or restricted)
        if ttl is not None:m.media_ttl_seconds=ttl
        existing_media=db.get(SavedMedia,m.id)
        # Never retain/re-serve media content where explicit protection was detected.
        if m.restricted_media and existing_media and not m.rescued_once:
            db.delete(existing_media)
            existing_media=None
        if filename and existing_media and not existing_media.file_name:existing_media.file_name=filename
        if media and not existing_media:
            db.add(SavedMedia(message_row_id=m.id,mime_type=media[0],encrypted_bytes=encrypt_media(db,m,media[1]),byte_count=len(media[1]),file_name=filename))
    return alerts

def eligible_reply_capture(raw, owner_id):
    """Owner's explicit reply to incoming media in the same private Business chat.

    Telegram may omit the original file_id. In that case, do not claim capture.
    We never guess or reconstruct bytes absent from Telegram's response.
    """
    if not isinstance(raw,dict) or (raw.get('chat') or {}).get('type')!='private':return None
    if (raw.get('from') or {}).get('id')!=owner_id:return None
    reply=raw.get('reply_to_message')
    if not isinstance(reply,dict):return None
    if not isinstance(reply.get('message_id'),int):return None
    if isinstance(reply.get('from'),dict) and reply['from'].get('id')==owner_id:return None
    if isinstance(reply.get('chat'),dict) and reply['chat'].get('id')!=raw['chat'].get('id'):return None
    if not any(reply.get(k) for k in ('photo','video','voice','video_note','animation')):return None
    if not media_descriptor(reply,reply_capture=True):return None
    return reply

def save_replied_media(db, original, reply, media):
    """Attach the exact media returned by Telegram to the original archive row.

    For already archived messages, reuse their identity and do not duplicate media.
    """
    if not media:return []
    connection_id=reply.get('business_connection_id','')
    conn=db.get(Connection,connection_id)
    if not conn or not conn.active:return []
    cid=(reply.get('chat') or {}).get('id')
    mid=original.get('message_id')
    if not isinstance(cid,int) or not isinstance(mid,int):return []
    original=dict(original)
    original['business_connection_id']=connection_id
    original['chat']=reply['chat']
    # Construct the event as an original incoming record. Never attach the
    # content to the owner's outgoing reply message.
    save_message(db,original,False,None)
    m=db.scalar(select(Message).where(Message.connection_id==connection_id,Message.chat_id==cid,Message.message_id==mid))
    if not m or m.sender_id==conn.owner_id:return []
    if m.rescued_once or db.get(SavedMedia,m.id):return []
    m.kind=next((k for k in ('photo','video','voice','video_note','animation') if original.get(k)),m.kind)
    m.rescued_once=True
    m.updated_at=datetime.now(timezone.utc)
    m.event_at=m.updated_at
    db.add(SavedMedia(message_row_id=m.id,mime_type=media[0],encrypted_bytes=encrypt_media(db,m,media[1]),byte_count=len(media[1]),file_name=None))
    db.add(Event(owner_id=conn.owner_id,message_row_id=m.id,kind='capture',created_at=m.updated_at))
    return [(conn.owner_id,'capture',m.chat_name)]

def remove_messages(db,payload):
    alerts=[]
    cid=(payload.get('chat') or {}).get('id');connection_id=payload.get('business_connection_id','')
    conn=db.get(Connection,connection_id)
    if not conn or not conn.active or not isinstance(cid,int):return alerts
    for mid in payload.get('message_ids',[]):
        m=db.scalar(select(Message).where(Message.connection_id==connection_id,Message.chat_id==cid,Message.message_id==mid))
        if m and not m.deleted:
            # Telegram deletions carry only message IDs; sender identity is taken
            # from the stored original, never inferred from the chat title.
            if m.sender_id==conn.owner_id:
                # Track delivery once while keeping counterpart-deletion flags untouched.
                if not m.own_deleted:
                    m.own_deleted=True
                    m.updated_at=datetime.now(timezone.utc)
                    alerts.append((conn.owner_id,'own_delete',m.chat_name))
            else:
                m.deleted=True;m.updated_at=datetime.now(timezone.utc);m.event_at=m.updated_at
                db.add(Event(owner_id=conn.owner_id,message_row_id=m.id,kind='delete'))
                alerts.append((conn.owner_id,'delete',m.chat_name))
    return alerts

from short_video import VideoService
video_service=VideoService(BOT_TOKEN, log)

async def respond_snippet_or_download(raw, *, business=False):
    msg=raw.get('business_message' if business else 'message') or {}
    if not isinstance(msg,dict):return
    chat=msg.get('chat') or {}
    if chat.get('type')!='private':return
    who=(msg.get('from') or {}).get('id')
    if not isinstance(who,int):return
    connection_id=msg.get('business_connection_id') if business else None
    if business:
        with SessionLocal() as db:
            conn=db.get(Connection,connection_id or '')
            if not conn or not conn.active or who!=conn.owner_id:return
    elif who!=chat.get('id'):return
    # Ignore messages sent by the connected bot to prevent self-triggered loops.
    if msg.get('sender_business_bot') or msg.get('via_bot') or msg.get('is_automatic_forward'):return
    body=(msg.get('text') or '').strip()
    if not body:return
    destination=chat['id']
    if body.startswith('/dl ') or (not business and video_service.is_supported_url(body)):
        link=body[4:].strip() if body.startswith('/dl ') else body
        await video_service.begin(who,destination,link,connection_id)
        return
    command=body.split(maxsplit=1)[0].split('@',1)[0].lstrip('/').lower()
    if not body.startswith('/') or not SNIPPET_TAG.fullmatch(command):return
    with SessionLocal() as db:
        snippet=db.get(Snippet,(who,command))
        content=dec(snippet.body_encrypted) if snippet else None
    if content:
        await video_service.send_text(destination,content,connection_id)

async def respond_inline(raw):
    query=raw.get('inline_query') or {}
    owner=(query.get('from') or {}).get('id')
    if not isinstance(owner,int):return
    needle=(query.get('query') or '').strip().lower().lstrip('/')[:32]
    with SessionLocal() as db:
        rows=db.scalars(select(Snippet).where(Snippet.owner_id==owner).order_by(Snippet.tag)).all()
        matches=[r for r in rows if needle in r.tag][:20]
        items=[{'type':'article','id':'s'+r.tag,'title':'/'+r.tag,
                'description':dec(r.body_encrypted)[:100],
                'input_message_content':{'message_text':dec(r.body_encrypted)}} for r in matches]
    await video_service.api('answerInlineQuery',{'inline_query_id':query['id'],'results':items,'cache_time':0,'is_personal':True})

@app.post('/webhook/telegram')
async def webhook(request:Request,x_telegram_bot_api_secret_token:Optional[str]=Header(None)):
    if not x_telegram_bot_api_secret_token or not hmac.compare_digest(x_telegram_bot_api_secret_token,SECRET):raise HTTPException(403,'Forbidden')
    if int(request.headers.get('content-length','0') or '0')>2*1024*1024:raise HTTPException(413,'Update too large')
    try:raw=await request.json()
    except ValueError:raise HTTPException(400,'Invalid JSON')
    if not isinstance(raw,dict):raise HTTPException(400,'Invalid update')
    update_id=raw.get('update_id')
    if not isinstance(update_id,int):raise HTTPException(400,'Bad update')
    new_media=await fetch_media(raw['business_message']) if 'business_message' in raw and (raw['business_message'].get('chat') or {}).get('type')=='private' else None
    edited_media=await fetch_media(raw['edited_business_message']) if 'edited_business_message' in raw and (raw['edited_business_message'].get('chat') or {}).get('type')=='private' else None
    # A reply containing the original photo can expose a usable file_id even
    # when the initial Business event did not. Download before entering DB TX.
    replied_original=None
    replied_media=None
    replied_message=raw.get('business_message')
    if isinstance(replied_message,dict):
        with SessionLocal() as pre_db:
            conn=pre_db.get(Connection,replied_message.get('business_connection_id',''))
            if conn and conn.active:
                replied_original=eligible_reply_capture(replied_message,conn.owner_id)
        if replied_original is not None:
            replied_media=await fetch_media(replied_original,reply_capture=True)

    alerts=[]
    with SessionLocal.begin() as db:
        if db.get(ProcessedUpdate,update_id):return {'ok':True}
        db.add(ProcessedUpdate(id=update_id))
        if 'business_connection' in raw:
            b=raw['business_connection'];cid=b.get('id');uid=(b.get('user') or {}).get('id')
            if cid and isinstance(uid,int):
                conn=db.get(Connection,cid)
                if conn and conn.owner_id!=uid:raise HTTPException(403,'Connection mismatch')
                if not conn:db.add(Connection(id=cid,owner_id=uid,active=bool(b.get('is_enabled',False))))
                else:conn.active=bool(b.get('is_enabled',False));conn.updated_at=datetime.now(timezone.utc)
        if 'business_message' in raw:alerts.extend(save_message(db,raw['business_message'],False,new_media) or [])
        if replied_original is not None and replied_media is not None:
            alerts.extend(save_replied_media(db,replied_original,replied_message,replied_media))
        if 'edited_business_message' in raw:alerts.extend(save_message(db,raw['edited_business_message'],True,edited_media) or [])
        if 'deleted_business_messages' in raw:alerts.extend(remove_messages(db,raw['deleted_business_messages']) or [])
        msg=raw.get('message') or {}
        if msg.get('text','').split(' ',1)[0]=='/start' and msg.get('chat',{}).get('type')=='private':
            uid=msg.get('from',{}).get('id')
            if isinstance(uid,int) and uid==msg['chat']['id']:
                prefs=db.get(Preferences,uid)
                if not prefs:
                    prefs=Preferences(owner_id=uid)
                    db.add(prefs)
                prefs.started_bot=True
    # Deliver only after transaction commit; a /start and explicit opt-in are required.
    for uid,kind,chat in alerts:
        with SessionLocal() as db:
            prefs=db.get(Preferences,uid)
            allowed=bool(prefs and prefs.started_bot and {
                'delete':prefs.notify_delete,
                'edit':prefs.notify_edit,
                'own_delete':prefs.notify_own_delete,
                'own_edit':prefs.notify_own_edit,
            }.get(kind,False))
        if allowed or (kind=='capture' and bool(prefs and prefs.started_bot)):
            label={'capture':'📷 Фото сохранено','delete':'🗑 Удалено сообщение',
                   'edit':'✏️ Изменено сообщение','own_delete':'🗑 Ты удалил сообщение',
                   'own_edit':'✏️ Ты изменил сообщение'}.get(kind,'Событие')
            foot='\nЭто уведомление о твоём действии.' if kind in ('own_delete','own_edit') else '\nОткрой Sbewo, чтобы посмотреть детали.'
            await telegram_send(uid,label+' · '+chat+foot)
    msg=raw.get('message') or {}
    if msg.get('text','').split(' ',1)[0]=='/start' and msg.get('chat',{}).get('type')=='private':
        await telegram_send(msg['chat']['id'],'Привет! Это Sbewo 🐱\nОткрой мини-приложение через кнопку меню бота. Для отслеживания новых сообщений подключи бота в настройках Telegram Business. Мы не просим код входа или пароль.')
    # Work with optional commands only after update has been committed.
    # Catch failures so webhook delivery of event archive is unaffected.
    try:
        if 'callback_query' in raw and str((raw['callback_query'].get('data') or '')).startswith('vd:'):
            await video_service.on_choice(raw['callback_query'])
        if 'inline_query' in raw:await respond_inline(raw)
        if 'message' in raw:await respond_snippet_or_download(raw)
        if 'business_message' in raw:await respond_snippet_or_download(raw,business=True)
    except Exception:
        log.exception('Optional tools update failed')
    return {'ok':True}

def prune_expired():
    now=datetime.now(timezone.utc)
    snapshot_limit=now-timedelta(days=SNAPSHOT_DAYS)
    event_limit=now-timedelta(days=EVENT_DAYS)
    with SessionLocal.begin() as db:
        # Independent expiry: ordinary snapshots for up to 30 days, and
        # event content for 7 days after the LAST deletion/edit/capture.
        ids=db.scalars(select(Message.id).where(
            ((Message.event_at.is_(None)) & (Message.created_at<snapshot_limit)) |
            ((Message.event_at.is_not(None)) & (Message.event_at<event_limit)) |
            # Legacy events before event_at was introduced.
            ((Message.event_at.is_(None)) &
             ((Message.deleted==True)|(Message.edited==True)|(Message.rescued_once==True)) &
             (Message.updated_at<event_limit))
        )).all()
        for i in range(0,len(ids),400):
            chunk=ids[i:i+400]
            db.execute(delete(SavedMedia).where(SavedMedia.message_row_id.in_(chunk)))
            db.execute(delete(Revision).where(Revision.message_row_id.in_(chunk)))
            db.execute(delete(Event).where(Event.message_row_id.in_(chunk)))
            # Cryptographic erasure: destroy each message's DEK wrapper.
            db.execute(delete(MessageKey).where(MessageKey.message_row_id.in_(chunk)))
            db.execute(delete(Message).where(Message.id.in_(chunk)))
        # A record's revision chain shares its DEK and expires together,
        # 7 days after the most recent qualifying event.
        db.execute(delete(Event).where(Event.created_at<event_limit))
        db.execute(delete(ProcessedUpdate).where(ProcessedUpdate.at<now-timedelta(days=7)))
    return len(ids)

async def retention_worker():
    # Runs in the existing API process; no separate cron deployment required.
    while True:
        try:await asyncio.to_thread(prune_expired)
        except Exception:log.exception('Retention maintenance failed')
        await asyncio.sleep(6*60*60)

class DeleteAccount(Auth):
    confirm:str

@app.post('/api/delete-account')
def delete_account(a:DeleteAccount):
    uid=identify(a)
    if a.confirm!='DELETE':raise HTTPException(400,'Confirmation required')
    with SessionLocal.begin() as db:
        ids=db.scalars(select(Message.id).where(Message.owner_id==uid)).all()
        if ids:
            db.execute(delete(SavedMedia).where(SavedMedia.message_row_id.in_(ids)))
            db.execute(delete(MessageKey).where(MessageKey.message_row_id.in_(ids)))
            db.execute(delete(Revision).where(Revision.message_row_id.in_(ids)))
        db.execute(delete(Event).where(Event.owner_id==uid))
        db.execute(delete(Message).where(Message.owner_id==uid))
        db.execute(delete(ChatArchiveMode).where(ChatArchiveMode.owner_id==uid))
        db.execute(delete(Snippet).where(Snippet.owner_id==uid))
        db.execute(delete(Preferences).where(Preferences.owner_id==uid))
        db.execute(delete(Connection).where(Connection.owner_id==uid))
    return {'ok':True,'notice':'Existing Telegram Business access must also be revoked in Telegram settings.'}

@app.post('/admin/retention',include_in_schema=False)
def retention(x_sbewo_admin_secret:Optional[str]=Header(None)):
    # For initial MVP, only an operator with webhook secret may prune old private content.
    if not x_sbewo_admin_secret or not hmac.compare_digest(x_sbewo_admin_secret,SECRET):raise HTTPException(403,'Forbidden')
    return {'ok':True,'pruned':prune_expired()}
