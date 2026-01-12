import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  startConversation,
} from '../../services/api';
import { Send, User, MessageCircle, MoreVertical, Loader2, Search, ArrowLeft } from 'lucide-react';

type ApiConversation = any;
type ApiMessage = any;

export default function Chat() {
  const { user: currentUser } = useAuth();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const pendingTargetRef = useRef<{ itemId: number | null; sellerId: number | null } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // -----------------------------
  // ✅ Match Flutter model fields
  // -----------------------------
  const getConvId = (c: any) => Number(c?.id ?? c?.conversation_id ?? c?.chat_id ?? 0);

  const getOtherUser = (c: any) => (c?.other_user ?? c?.otherUser ?? null);

 const normalizeConversation = (c: any) => {
  const other = getOtherUser(c) || {};

  // ✅ SAME logic as Flutter (item OR item_snapshot)
  const rawItem =
    (c?.item && typeof c.item === 'object' && Object.keys(c.item).length)
      ? c.item
      : (c?.item_snapshot && typeof c.item_snapshot === 'object')
        ? c.item_snapshot
        : null;

  const itemId = Number(rawItem?.id ?? c?.item_id ?? 0) || null;
  const itemTitle = String(rawItem?.title ?? rawItem?.name ?? c?.item_title ?? '');
  const itemPrice = String(rawItem?.price ?? c?.item_price ?? '');
  const itemCity = String(rawItem?.city ?? rawItem?.location ?? c?.item_city ?? '');
  const itemPhoto =
    String(
      rawItem?.feature_photo_url ??
      rawItem?.photo_url ??
      rawItem?.image ??
      c?.item_photo_url ??
      ''
    );

  return {
    ...c,
    __conv_id: getConvId(c),

    __other: other,
    __other_id: Number(other?.id ?? c?.other_user_id ?? 0),
    __other_name: String(other?.name ?? c?.other_user_name ?? 'Unknown User'),
    __other_avatar: String(other?.avatar_url ?? c?.other_user_avatar ?? ''),
    __online: Boolean(other?.is_online ?? other?.online ?? c?.online ?? false),

    __last: String(c?.last_message_preview ?? c?.last_message ?? ''),
    __last_at: c?.last_message_at ? new Date(c.last_message_at) : null,
    __unread: Number(c?.unread_count ?? 0),

    // ✅ ITEM FIELDS (THIS WAS MISSING)
    __item_id: itemId,
    __item_title: itemTitle,
    __item_price: itemPrice,
    __item_city: itemCity,
    __item_photo: itemPhoto,
  };
};


  const normalizedConversations = useMemo(() => {
    return (conversations || []).map(normalizeConversation).filter((c) => c.__conv_id > 0);
  }, [conversations]);

  // ✅ IMPORTANT: prevent duplicates if API ever returns repeated rows
  const uniqueConversations = useMemo(() => {
    const map = new Map<number, any>();
    for (const c of normalizedConversations) {
      const id = c.__conv_id;
      if (!map.has(id)) {
        map.set(id, c);
      } else {
        const existing = map.get(id);
        const t1 = existing.__last_at ? existing.__last_at.getTime() : 0;
        const t2 = c.__last_at ? c.__last_at.getTime() : 0;
        if (t2 >= t1) map.set(id, c);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const t1 = a.__last_at ? a.__last_at.getTime() : 0;
      const t2 = b.__last_at ? b.__last_at.getTime() : 0;
      return t2 - t1;
    });
  }, [normalizedConversations]);

  const filteredConversations = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return uniqueConversations;
    return uniqueConversations.filter((c) => {
      const name = String(c.__other_name || '').toLowerCase();
      const last = String(c.__last || '').toLowerCase();
      return name.includes(query) || last.includes(query);
    });
  }, [uniqueConversations, q]);

  const activeConversation = useMemo(() => {
    if (activeChatId === null) return null;
    return uniqueConversations.find((c) => c.__conv_id === activeChatId) ?? null;
  }, [uniqueConversations, activeChatId]);

  const chatTarget = useMemo(() => {
    const state = location.state as { itemId?: number; sellerId?: number; item_id?: number; other_user_id?: number } | null;
    const itemId = Number(state?.itemId ?? state?.item_id ?? 0) || null;
    const sellerId = Number(state?.sellerId ?? state?.other_user_id ?? 0) || null;
    if (!itemId && !sellerId) return null;
    return { itemId, sellerId };
  }, [location.state]);

  // -----------------------------
  // Load conversations
  // -----------------------------
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    setLoadingChats(true);
    try {
      const data = await getConversations();
      if (Array.isArray(data)) setConversations(data);
      else if (data?.data && Array.isArray(data.data)) setConversations(data.data);
      else setConversations([]);
    } catch (e) {
      console.error('Failed to load conversations:', e);
      setConversations([]);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (!chatTarget) return;
    pendingTargetRef.current = chatTarget;
  }, [chatTarget]);

  useEffect(() => {
    if (loadingChats) return;
    if (!pendingTargetRef.current) return;

    const { itemId, sellerId } = pendingTargetRef.current;
    const existing = uniqueConversations.find((c) => {
      const matchesItem = itemId ? c.__item_id === itemId : true;
      const matchesSeller = sellerId ? c.__other_id === sellerId : true;
      return matchesItem && matchesSeller;
    });

    if (existing) {
      setActiveChatId(existing.__conv_id);
      pendingTargetRef.current = null;
      return;
    }

    const startChat = async () => {
      const payload: Record<string, number> = {};
      if (itemId) payload.item_id = itemId;
      if (sellerId) payload.other_user_id = sellerId;
      if (!Object.keys(payload).length) {
        pendingTargetRef.current = null;
        return;
      }

      try {
        const response = await startConversation(payload);
        const data = (response as any)?.data ?? response;
        const conversation = data?.conversation ?? data;
        const conversationId = Number(data?.conversation_id ?? data?.id ?? conversation?.id ?? 0);

        if (conversationId) {
          if (conversation && typeof conversation === 'object') {
            setConversations((prev) => {
              const list = Array.isArray(prev) ? prev : [];
              if (list.some((c) => getConvId(c) === conversationId)) return list;
              return [conversation, ...list];
            });
          } else {
            await loadConversations();
          }
          setActiveChatId(conversationId);
        } else {
          await loadConversations();
        }
      } catch (e) {
        console.error('Failed to start conversation:', e);
      } finally {
        pendingTargetRef.current = null;
      }
    };

    startChat();
  }, [loadingChats, uniqueConversations]);

  // -----------------------------
  // Load messages on select
  // -----------------------------
  useEffect(() => {
    if (activeChatId === null) return;
    loadMessages(activeChatId);
    markRead(activeChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const markRead = async (id: number) => {
    try {
      await markConversationRead(id);
    } catch (e) {
      // ignore
    } finally {
      // optimistic unread clear
      setConversations((prev) =>
        (prev || []).map((c: any) =>
          getConvId(c) === id ? { ...c, unread_count: 0 } : c
        )
      );
    }
  };

  const loadMessages = async (id: number) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(id);

      let list: ApiMessage[] = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data?.messages)) list = data.messages;
      else if (Array.isArray(data?.data?.messages)) list = data.data.messages;

      // ✅ Normalize messages to Flutter model keys:
      // body, is_me, sender_id, created_at
      const normalized = list.map((m: any) => ({
        ...m,
        __id: Number(m?.id ?? 0),
        __body: String(m?.body ?? m?.message ?? ''),
        __is_me: Boolean(m?.is_me ?? false),
        __sender_id: Number(m?.sender_id ?? m?.user_id ?? 0),
        __is_read: Boolean(m?.is_read ?? false),
        __created_at: m?.created_at ? new Date(m.created_at) : null,
      }));

      setMessages(normalized);
    } catch (e) {
      console.error('Failed to load messages:', e);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => scrollToBottom(), 80);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // -----------------------------
  // Send message
  // -----------------------------
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || activeChatId === null || sending) return;

    const tempId = Date.now();
    const temp = {
      id: tempId,
      body: newMessage,
      is_me: true,
      sender_id: currentUser?.id ?? 0,
      is_read: true,
      created_at: new Date().toISOString(),
      __id: tempId,
      __body: newMessage,
      __is_me: true,
      __sender_id: currentUser?.id ?? 0,
      __is_read: true,
      __created_at: new Date(),
      __optimistic: true,
    };

    setMessages((prev) => [...prev, temp]);
    setNewMessage('');
    scrollToBottom();

    try {
      setSending(true);

      // API expects conversation id + body
      await sendMessage(activeChatId, temp.body);

      // Update sidebar preview
      setConversations((prev) =>
        (prev || []).map((c: any) => {
          if (getConvId(c) !== activeChatId) return c;
          return {
            ...c,
            last_message_preview: temp.body,
            last_message_at: new Date().toISOString(),
            unread_count: 0,
          };
        })
      );
    } catch (e) {
      console.error('send failed:', e);
      // remove optimistic
      setMessages((prev) => prev.filter((m: any) => m.__id !== tempId));
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // -----------------------------
  // Avatar
  // -----------------------------
  const Avatar = ({ url, name }: { url?: string; name?: string }) => {
    const hasUrl = url && url.startsWith('http');
    if (hasUrl) {
      return (
        <img
          src={url}
          alt={name || 'User'}
          className="w-10 h-10 rounded-full object-cover bg-slate-200 border border-slate-200"
          onError={(e) => ((e.currentTarget.style.display = 'none'))}
        />
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
        <User className="w-5 h-5 text-slate-400" />
      </div>
    );
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loadingChats) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-slate-400" />
        <p>Loading chats...</p>
      </div>
    );
  }

  const activeOtherName = activeConversation?.__other_name ?? 'Chat';

  return (
    <div className="h-[calc(100vh-140px)] min-h-[620px] bg-white border border-slate-200 rounded-2xl shadow-sm flex overflow-hidden">
      {/* SIDEBAR */}
      <div className={`w-full md:w-96 border-r border-slate-200 flex flex-col ${activeChatId !== null ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: primaryColor }} />
              Messages
            </h2>
            <button
              onClick={loadConversations}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No conversations found.</div>
          ) : (
            filteredConversations.map((c: any) => {
              const isActive = activeChatId === c.__conv_id;

              return (
                <button
                  key={c.__conv_id}
                  onClick={() => setActiveChatId(c.__conv_id)}
                  className={`w-full p-4 text-left flex gap-3 transition-colors border-b border-slate-100 ${
                    isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar url={c.__other_avatar} name={c.__other_name} />

                    {/* Online dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        c.__online ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />

                    {/* Unread badge */}
                    {c.__unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-white font-bold">
                        {c.__unread}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <span className="font-semibold text-slate-900 truncate">{c.__other_name}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {c.__last_at ? c.__last_at.toLocaleDateString() : ''}
                      </span>
                    </div>

                    <p className={`text-sm truncate ${c.__unread > 0 ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {c.__last || 'Start chatting...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className={`flex-1 flex flex-col bg-slate-50/30 ${activeChatId === null ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId !== null && activeConversation ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-full"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <Avatar url={activeConversation.__other_avatar} name={activeConversation.__other_name} />
                  <div className="leading-tight">
                    <span className="font-semibold text-slate-900 block">{activeOtherName}</span>
                    <span className="text-xs text-slate-500">{activeConversation.__online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* ✅ ITEM HEADER (same as Flutter chat) */}
{/* ✅ ITEM HEADER (same as Flutter chat) */}
{activeConversation?.__item_id && (
  <button
    type="button"
    onClick={() => navigate(`/item/${activeConversation.__item_id}`)}
    className="px-4 py-3 bg-white border-b border-slate-200 w-full text-left hover:bg-slate-50 transition"
  >
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
        {activeConversation.__item_photo?.startsWith('http') && (
          <img
            src={activeConversation.__item_photo}
            alt={activeConversation.__item_title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="font-semibold text-slate-900 truncate">
          {activeConversation.__item_title}
        </div>
        <div className="text-sm font-semibold text-blue-600">
          {activeConversation.__item_price}
        </div>
        {activeConversation.__item_city && (
          <div className="text-xs text-slate-500 truncate">
            {activeConversation.__item_city}
          </div>
        )}
      </div>
    </div>

    <div className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
      <span className="font-semibold">Safety:</span> Never transfer money in advance.
    </div>
  </button>
)}



            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageCircle className="w-12 h-12 opacity-20" />
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((m: any) => {
                  const isMe = Boolean(m.__is_me);
                  const time =
                    m.__created_at instanceof Date
                      ? m.__created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                  return (
                    <div key={m.__id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? 'text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}
                        style={isMe ? { backgroundColor: primaryColor } : {}}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{m.__body}</p>
                        <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-white' : 'text-slate-400'}`}>
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-700">Your Messages</p>
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
