import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users, Server, ShieldCheck, AlertCircle, Search,
    Cpu, Globe, Database, Trash2, ShieldAlert,
    RefreshCw, MessageSquare, Power, Ban,
    ArrowLeft, Megaphone, Activity, Clock, Zap, Coins, Plus, Minus, X, Inbox, Mail
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const AdminHub = () => {
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        isDanger: true,
        onConfirm: null
    });
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [overviewData, setOverviewData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUserChat, setSelectedUserChat] = useState(null);
    const [chatHistory, setChatHistory] = useState([]); // eslint-disable-line no-unused-vars
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [toast, setToast] = useState(null);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastSent, setBroadcastSent] = useState(false);
    const [broadcastPriority, setBroadcastPriority] = useState('info');
    const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());

    const [adminMessages, setAdminMessages] = useState([]);
    const [messageTypeFilter, setMessageTypeFilter] = useState('all');
    const [loadingMessages, setLoadingMessages] = useState(false);

    const [coinData, setCoinData] = useState({ users: [], totalCoinsIssued: 0, premiumCount: 0 });
    const [coinSearch, setCoinSearch] = useState('');
    const [selectedCoinUser, setSelectedCoinUser] = useState(null);
    const [coinAdjust, setCoinAdjust] = useState({ amount: '', reason: '', loading: false });

    useEffect(() => {
        const t = setInterval(() => setSystemTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(t);
    }, []);

    const token = sessionStorage.getItem('token');
    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        const fetchStatsAndOverview = async () => {
            try {
                const [statsRes, overviewRes] = await Promise.all([
                    axios.get(`${API_BASE}/admin/stats`, axiosConfig),
                    axios.get(`${API_BASE}/admin/overview`, axiosConfig)
                ]);
                setStats(statsRes.data);
                setOverviewData(overviewRes.data);
            } catch (err) {
                console.error(err);
                showToast('Failed to load system statistics', 'error');
            }
        };
        fetchStatsAndOverview();
    }, [refreshTrigger]);

    useEffect(() => {
        if (activeTab !== 'coins') return;
        const fetchCoinData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/admin/coins`, axiosConfig);
                setCoinData(res.data);
            } catch (err) {
                showToast('Failed to load coin management data', 'error');
            }
        };
        fetchCoinData();
    }, [activeTab, refreshTrigger]);

    useEffect(() => {
        if (activeTab !== 'messages') return;
        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const res = await axios.get(`${API_BASE}/admin/messages`, axiosConfig);
                setAdminMessages(res.data || []);
            } catch (err) {
                showToast('Failed to load user messages/requests', 'error');
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeTab, refreshTrigger]);

    const handleDeleteAdminMessage = (msgId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Message',
            message: 'Are you sure you want to remove this contact message from your inbox?',
            confirmText: 'Delete Message',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/admin/messages/${msgId}`, axiosConfig);
                    showToast('User message deleted');
                    setAdminMessages(prev => prev.filter(m => m._id !== msgId));
                } catch (err) {
                    showToast('Error deleting message', 'error');
                }
            }
        });
    };

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE}/admin/users`, axiosConfig);
                setUsers(res.data);
            } catch (err) {
                console.error(err);
                showToast('Failed to fetch user directory', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [refreshTrigger, activeTab]);

    const handleRoleChange = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await axios.put(`${API_BASE}/admin/users/${userId}/role`, { role: newRole }, axiosConfig);
            showToast(`User role updated to ${newRole}`);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            showToast(err.response?.data?.msg || 'Error changing role', 'error');
        }
    };

    const handleBanToggle = async (userId) => {
        try {
            const res = await axios.put(`${API_BASE}/admin/users/${userId}/ban`, {}, axiosConfig);
            showToast(res.data.msg);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            showToast('Error modifying user account status', 'error');
        }
    };

    const handleDeleteUser = (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User Account',
            message: 'Are you sure you want to permanently delete this user and purge their entire conversation history? This action cannot be reversed.',
            confirmText: 'Delete User',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/admin/users/${userId}`, axiosConfig);
                    showToast('User account successfully deleted');
                    setRefreshTrigger(prev => prev + 1);
                } catch (err) {
                    showToast('Error deleting user account', 'error');
                }
            }
        });
    };

    const handleViewChat = async (user) => {
        try {
            const res = await axios.get(`${API_BASE}/admin/users/${user._id}/chats`, axiosConfig);
            setSelectedUserChat(user);
            setChatHistory(res.data.messages || []);
            setActiveTab('chats');
        } catch (err) {
            showToast('Could not load user chat history', 'error');
        }
    };

    const handleClearChat = (userId) => {
        setConfirmModal({
            isOpen: true,
            title: 'Clear Conversation History',
            message: 'Are you sure you want to delete all stored chat logs for this user? Active stats and login details will remain intact.',
            confirmText: 'Clear Logs',
            isDanger: true,
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/admin/users/${userId}/chats`, axiosConfig);
                    showToast('Chat history successfully cleared');
                    if (selectedUserChat?._id === userId) {
                        setChatHistory([]);
                    }
                    setRefreshTrigger(prev => prev + 1);
                } catch (err) {
                    showToast('Failed to clear chat history', 'error');
                }
            }
        });
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ? true :
            statusFilter === 'banned' ? u.isBanned : !u.isBanned;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || '0', trend: `${stats?.onboardedUsers || 0} onboarded`, icon: Users, color: '#00e5ff' },
        { label: 'Total Messages', value: stats?.totalMessages || '0', trend: `${stats?.totalChats || 0} chat channels`, icon: MessageSquare, color: '#ff007f' },
        { label: 'System Status', value: 'Active', trend: stats?.uptimeFormatted || 'Online', icon: ShieldCheck, color: '#00ffaa' },
        { label: 'Server Memory', value: `${stats?.rssMB || 0} MB`, trend: `Heap: ${stats?.heapUsedMB || 0}MB`, icon: Database, color: '#a200ff' }
    ];

    return (
        <div className="p-8 space-y-8 min-h-screen bg-[#050308] text-white">

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-center gap-3 ${
                            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-green-500/20 border-green-500/50 text-green-200'
                        }`}
                    >
                        {toast.type === 'error' ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                        <span className="font-mono text-sm">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyberNeon/50 hover:text-cyberNeon text-gray-400 transition-all"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-orbitron font-black tracking-tighter text-white">ADMIN / <span className="text-cyberNeon">DASHBOARD</span></h1>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-1">Management Portal</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        className="bg-white/5 border border-white/10 hover:border-cyberNeon/50 p-3 rounded-xl transition-all hover:bg-white/10 text-cyberNeon"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('token');
                            sessionStorage.removeItem('user');
                            navigate('/login');
                        }}
                        className="bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 font-orbitron font-bold px-6 py-2.5 rounded-xl transition-all text-xs flex items-center gap-2"
                    >
                        <Power size={14} /> LOG OUT
                    </button>
                </div>
            </div>

            <div className="flex gap-2 border-b border-white/5 pb-1 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: Cpu },
                    { id: 'users', label: 'Users Directory', icon: Users },
                    { id: 'messages', label: 'User Messages/Requests', icon: Inbox },
                    { id: 'coins', label: 'Twin Coins', icon: Coins },
                    { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
                    { id: 'system', label: 'System Diagnostics', icon: Server }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-orbitron text-xs font-semibold uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                                ? 'bg-white/5 text-cyberNeon border-b-2 border-cyberNeon'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={stat.label}
                                className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden group bg-[#0d0714]/40"
                            >
                                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <stat.icon size={120} />
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-2xl bg-white/5" style={{ color: stat.color }}>
                                        <stat.icon size={24} />
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-cyberBlue">
                                        {stat.trend}
                                    </span>
                                </div>
                                <h3 className="text-gray-500 text-xs font-mono uppercase tracking-widest">{stat.label}</h3>
                                <p className="text-3xl font-orbitron font-black mt-1">{stat.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-3">
                                    <Globe className="text-cyberBlue" size={18} /> API MESSAGE ACTIVITY (24H)
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.hourlyThroughput || []}>
                                        <defs>
                                            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#ffffff20" tick={{ fill: '#888', fontSize: 10 }} />
                                        <Tooltip
                                            contentStyle={{ background: '#0a050d', border: '1px solid #ffffff10', borderRadius: '15px' }}
                                            itemStyle={{ color: '#00e5ff', fontFamily: 'monospace' }}
                                        />
                                        <Area type="monotone" dataKey="load" stroke="#00e5ff" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 flex flex-col">
                            <h3 className="font-orbitron font-bold text-sm tracking-wider mb-6 flex items-center gap-3">
                                <AlertCircle className="text-cyberPink" size={18} /> SYSTEM STATUS ALERTS
                            </h3>
                            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {stats?.alerts?.map((alert) => (
                                    <div key={alert.id} className="p-4 rounded-2xl bg-white/5 border-l-4 border-white/5 hover:bg-white/10 transition-all" style={{ borderLeftColor: alert.color }}>
                                        <div className="flex justify-between text-[9px] font-mono mb-1">
                                            <span style={{ color: alert.color }}>{alert.type}</span>
                                            <span className="text-gray-500">INFO</span>
                                        </div>
                                        <p className="text-xs font-inter text-gray-300 font-semibold leading-relaxed">{alert.msg}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20">
                            <h3 className="font-orbitron font-bold text-sm tracking-wider mb-6">NEW USER REGISTRATIONS (7 DAYS)</h3>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={overviewData?.growth || []}>
                                        <XAxis dataKey="date" stroke="#ffffff10" tick={{ fill: '#888', fontSize: 10 }} />
                                        <Tooltip contentStyle={{ background: '#0a050d', border: '1px solid #ffffff10', borderRadius: '15px' }} />
                                        <Bar dataKey="newUsers" fill="#a200ff" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20">
                            <h3 className="font-orbitron font-bold text-sm tracking-wider mb-6">RECENTLY REGISTERED USERS</h3>
                            <div className="space-y-4">
                                {overviewData?.recentUsers?.map((u) => (
                                    <div key={u._id} className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-cyberNeon/15 flex items-center justify-center font-bold font-orbitron text-xs text-cyberNeon">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-white">{u.username}</h4>
                                                <p className="text-gray-500 text-[10px] font-mono">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyberPink capitalize">{u.role}</span>
                                            <p className="text-gray-500 text-[9px] font-mono mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search by username or email..."
                                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyberNeon transition-all w-full text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <select
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-orbitron text-white focus:outline-none focus:border-cyberNeon cursor-pointer"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="all" className="bg-[#0f0714]">ALL ROLES</option>
                                <option value="admin" className="bg-[#0f0714]">ADMIN ONLY</option>
                                <option value="user" className="bg-[#0f0714]">USER ONLY</option>
                            </select>
                            <select
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-orbitron text-white focus:outline-none focus:border-cyberNeon cursor-pointer"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all" className="bg-[#0f0714]">ALL STATUS</option>
                                <option value="active" className="bg-[#0f0714]">ACTIVE ONLY</option>
                                <option value="banned" className="bg-[#0f0714]">BANNED ONLY</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="text-gray-500 text-[10px] uppercase font-mono border-b border-white/5 pb-4">
                                    <th className="pb-4 px-4">User</th>
                                    <th className="pb-4 px-4">User ID</th>
                                    <th className="pb-4 px-4">Role</th>
                                    <th className="pb-4 px-4">Status</th>
                                    <th className="pb-4 px-4">Messages Sent</th>
                                    <th className="pb-4 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono">LOADING USER DIRECTORY...</td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500 font-mono">NO USERS FOUND matching the criteria.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="group border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold font-orbitron text-xs text-white">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-white tracking-tight block">{user.username}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono block">{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-xs font-mono text-gray-400">
                                                {user._id}
                                            </td>
                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() => handleRoleChange(user._id, user.role)}
                                                    className={`text-[9px] font-mono px-2 py-1 rounded font-bold uppercase transition-all ${
                                                        user.role === 'admin'
                                                            ? 'bg-cyberNeon/15 border border-cyberNeon/40 text-cyberNeon'
                                                            : 'bg-white/5 border border-white/10 text-gray-400'
                                                    }`}
                                                >
                                                    {user.role}
                                                </button>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-[9px] font-mono px-2 py-1 rounded font-bold uppercase ${
                                                    user.isBanned
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/35'
                                                        : 'bg-green-500/20 text-green-400 border border-green-500/35'
                                                }`}>
                                                    {user.isBanned ? 'Banned' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-xs font-mono text-gray-400">
                                                {user.messageCount} messages
                                            </td>
                                             <td className="py-4 px-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button
                                                        onClick={() => handleBanToggle(user._id)}
                                                        className={`p-2 hover:bg-white/5 rounded-lg transition-all ${user.isBanned ? 'text-green-400' : 'text-yellow-400'}`}
                                                        title={user.isBanned ? "Unban User" : "Ban User"}
                                                    >
                                                        <Ban size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'messages' && (
                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                        <div>
                            <h3 className="font-orbitron font-bold text-base tracking-wider flex items-center gap-3 text-white">
                                <Inbox className="text-cyberNeon" size={20} /> USER MESSAGES & REQUESTS
                            </h3>
                            <p className="text-gray-500 text-xs font-mono mt-1">Review incoming help, bugs, feedback, and feature requests submitted by users.</p>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                            {['all', 'help', 'issue', 'feedback', 'update request', 'feature request'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setMessageTypeFilter(type)}
                                    className={`px-3 py-1.5 rounded-xl font-orbitron text-[10px] uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
                                        messageTypeFilter === type
                                            ? 'bg-cyberNeon text-black'
                                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingMessages ? (
                        <div className="text-center py-16 text-cyberNeon font-mono text-xs animate-pulse">
                            Fetching incoming user dispatches...
                        </div>
                    ) : adminMessages.length === 0 ? (
                        <div className="text-center py-16 text-gray-500 font-mono text-xs flex flex-col items-center">
                            <Mail size={40} className="mb-3 text-gray-600" />
                            <span>No messages or user requests received yet.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {adminMessages
                                .filter(m => messageTypeFilter === 'all' || m.type === messageTypeFilter)
                                .map((msg) => {
                                    const badgeColors = {
                                        help: 'bg-red-500/15 text-red-400 border-red-500/30',
                                        issue: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                                        feedback: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                                        'update request': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                                        'feature request': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                                    };
                                    const badgeClass = badgeColors[msg.type] || 'bg-cyberNeon/15 text-cyberNeon border-cyberNeon/30';

                                    return (
                                        <div
                                            key={msg._id}
                                            className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 transition-all flex flex-col justify-between space-y-4"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`px-2.5 py-1 rounded-lg border font-mono text-[9px] uppercase font-bold tracking-wider ${badgeClass}`}>
                                                        {msg.type}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-gray-500">
                                                        {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="mb-2">
                                                    <h4 className="font-bold text-sm text-white font-orbitron">{msg.username}</h4>
                                                    <p className="text-[11px] font-mono text-gray-400">{msg.email}</p>
                                                </div>
                                                <p className="text-gray-200 text-xs font-inter leading-relaxed bg-[#0a050d] p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                            </div>
                                            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] font-mono text-gray-600">ID: {msg._id.slice(-6)}</span>
                                                <button
                                                    onClick={() => handleDeleteAdminMessage(msg._id)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-orbitron text-[10px] transition-all flex items-center gap-1.5"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-3">
                            <Megaphone className="text-cyberPink" size={18} /> COMPOSE SYSTEM ANNOUNCEMENT
                        </h3>
                        <p className="text-gray-500 text-xs font-mono">Send a notification or announcement to all active users. This will appear as a system message.</p>
                        <div className="space-y-4">
                            <textarea
                                value={broadcastMsg}
                                onChange={e => { setBroadcastMsg(e.target.value); setBroadcastSent(false); }}
                                placeholder="Type your announcement here... e.g. 'System maintenance scheduled for Sunday 2AM. Please save your work.'"
                                rows={6}
                                className="w-full bg-white/5 border border-white/10 focus:border-cyberPink/60 rounded-2xl px-5 py-4 text-sm text-white font-inter resize-none outline-none transition-all placeholder:text-gray-600"
                            />
                            <div className="flex gap-3">
                                <select
                                    value={broadcastPriority}
                                    onChange={e => setBroadcastPriority(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-orbitron text-white focus:outline-none focus:border-cyberPink cursor-pointer"
                                >
                                    <option value="info" className="bg-[#0f0714]">ðŸ“¢ Info</option>
                                    <option value="warning" className="bg-[#0f0714]">âš ï¸ Warning</option>
                                    <option value="critical" className="bg-[#0f0714]">ðŸš¨ Critical</option>
                                </select>
                                <button
                                    onClick={async () => {
                                        if (!broadcastMsg.trim()) { showToast('Message cannot be empty', 'error'); return; }
                                        try {
                                            const res = await axios.post(`${API_BASE}/admin/broadcast`, {
                                                message: broadcastMsg.trim(),
                                                priority: broadcastPriority
                                            }, axiosConfig);
                                            setBroadcastSent(true);
                                            showToast(res.data.msg || 'Broadcast sent!');
                                            setBroadcastMsg('');
                                            setRefreshTrigger(p => p + 1);
                                        } catch (err) {
                                            showToast(err.response?.data?.msg || 'Failed to send broadcast', 'error');
                                        }
                                    }}
                                    className="flex-1 py-3 bg-cyberPink text-white font-orbitron font-black text-xs rounded-xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <Megaphone size={14} /> BROADCAST NOW
                                </button>
                                <button
                                    onClick={() => { setBroadcastMsg(''); setBroadcastSent(false); }}
                                    className="px-6 py-3 border border-white/10 text-gray-500 font-orbitron text-xs rounded-xl hover:bg-white/5 transition-all"
                                >
                                    CLEAR
                                </button>
                            </div>
                            {broadcastSent && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-center gap-2">
                                    <ShieldCheck size={14} /> Broadcast successfully delivered to all registered users.
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-3">
                            <Activity className="text-cyberNeon" size={18} /> PLATFORM SNAPSHOT
                        </h3>
                        <div className="space-y-3 font-mono text-xs">
                            {[
                                { label: 'Total Registered Users', value: stats?.totalUsers || 0, color: '#00e5ff' },
                                { label: 'Onboarded (Setup Complete)', value: stats?.onboardedUsers || 0, color: '#00ffaa' },
                                { label: 'Total Chat Messages', value: stats?.totalMessages || 0, color: '#ff007f' },
                                { label: 'Active Chats', value: stats?.totalChats || 0, color: '#a200ff' },
                                { label: 'Server Uptime', value: stats?.uptimeFormatted || 'N/A', color: '#f59e0b' },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-gray-400">{row.label}:</span>
                                    <span className="font-bold" style={{ color: row.color }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'coins' && (() => {
                const filteredCoinUsers = (coinData.users || []).filter(u =>
                    (u.username || '').toLowerCase().includes(coinSearch.toLowerCase()) ||
                    (u.email || '').toLowerCase().includes(coinSearch.toLowerCase())
                );

                const handleCoinAdjust = async () => {
                    if (!selectedCoinUser || coinAdjust.amount === '') return;
                    const numAmount = parseInt(coinAdjust.amount);
                    if (isNaN(numAmount) || numAmount === 0) { showToast('Enter a valid non-zero amount', 'error'); return; }
                    setCoinAdjust(prev => ({ ...prev, loading: true }));
                    try {
                        const res = await axios.post(
                            `${API_BASE}/admin/users/${selectedCoinUser._id}/coins`,
                            { amount: numAmount, reason: coinAdjust.reason || 'Admin manual adjustment' },
                            axiosConfig
                        );
                        showToast(res.data.msg);
                        setSelectedCoinUser(null);
                        setCoinAdjust({ amount: '', reason: '', loading: false });
                        setRefreshTrigger(prev => prev + 1);
                    } catch (err) {
                        showToast(err.response?.data?.msg || 'Failed to adjust coins', 'error');
                        setCoinAdjust(prev => ({ ...prev, loading: false }));
                    }
                };

                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Total Coins In Circulation', value: coinData.totalCoinsIssued.toLocaleString(), icon: Coins, color: '#00e5ff' },
                                { label: 'Premium Users Unlocked', value: coinData.premiumCount, icon: ShieldCheck, color: '#00ffaa' },
                                { label: 'Total Users Tracked', value: coinData.users.length, icon: Users, color: '#a200ff' },
                            ].map((card, i) => (
                                <motion.div
                                    key={card.label}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className="glass-panel p-6 rounded-3xl border border-white/5 bg-[#0d0714]/40 flex items-center gap-5"
                                >
                                    <div className="p-3 rounded-2xl bg-white/5" style={{ color: card.color }}>
                                        <card.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest">{card.label}</p>
                                        <p className="text-2xl font-orbitron font-black text-white mt-0.5">{card.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                                        <Coins className="text-cyberNeon" size={16} /> TWIN COIN LEADERBOARD
                                    </h3>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search user or email..."
                                            value={coinSearch}
                                            onChange={e => setCoinSearch(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-cyberNeon transition-all w-full text-white"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left font-inter text-xs">
                                        <thead>
                                            <tr className="text-gray-500 text-[9px] uppercase font-mono border-b border-white/5">
                                                <th className="pb-3 px-2">#</th>
                                                <th className="pb-3 px-2">User</th>
                                                <th className="pb-3 px-2">Coins</th>
                                                <th className="pb-3 px-2">Level</th>
                                                <th className="pb-3 px-2">Streak</th>
                                                <th className="pb-3 px-2">Premium</th>
                                                <th className="pb-3 px-2">Last Active</th>
                                                <th className="pb-3 px-2 text-center">Manage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCoinUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-8 text-center text-gray-500 font-mono">No users found</td>
                                                </tr>
                                            ) : filteredCoinUsers.map((u, idx) => (
                                                <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 px-2 text-gray-600 font-mono">#{idx + 1}</td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-cyberNeon/15 flex items-center justify-center font-bold font-orbitron text-[10px] text-cyberNeon flex-shrink-0">
                                                                {u.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-white block">{u.username}</span>
                                                                <span className="text-[9px] text-gray-500 font-mono">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className="font-orbitron font-black text-cyberNeon text-sm">{u.coins.toLocaleString()}</span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-mono text-[9px] font-bold">LV {u.level}</span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <span className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5"><Zap size={9} className="inline flex-shrink-0" /> {u.currentStreak}d</span>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        {u.isPremium
                                                            ? <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono text-[9px] font-bold">UNLOCKED</span>
                                                            : <span className="bg-white/5 text-gray-500 border border-white/10 px-2 py-0.5 rounded font-mono text-[9px]">LOCKED</span>
                                                        }
                                                    </td>
                                                    <td className="py-3 px-2 text-[9px] text-gray-500 font-mono">
                                                        {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCoinUser(u);
                                                                setCoinAdjust({ amount: '', reason: '', loading: false });
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyberNeon/10 border border-cyberNeon/30 text-cyberNeon text-[9px] font-orbitron font-bold hover:bg-cyberNeon hover:text-black transition-all mx-auto"
                                                        >
                                                            <Coins size={10} /> ADJUST
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="glass-panel p-6 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-5">
                                    <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                                        <Zap className="text-cyberPink" size={16} /> MANUAL COIN ADJUSTMENT
                                    </h3>

                                    {selectedCoinUser ? (
                                        <>
                                            <div className="flex items-center justify-between p-3 bg-cyberNeon/5 border border-cyberNeon/20 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-cyberNeon/20 flex items-center justify-center font-bold font-orbitron text-xs text-cyberNeon">
                                                        {selectedCoinUser.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{selectedCoinUser.username}</p>
                                                        <p className="text-cyberNeon font-mono text-xs font-bold">{selectedCoinUser.coins.toLocaleString()} coins</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSelectedCoinUser(null)} className="text-gray-500 hover:text-white transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-gray-500 text-[10px] font-mono uppercase tracking-widest block mb-1.5">Amount (use negative to deduct)</label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setCoinAdjust(p => ({ ...p, amount: p.amount.startsWith('-') ? p.amount.slice(1) : (p.amount ? p.amount : '') }))}
                                                            className="p-2.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"
                                                            title="Add coins"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            placeholder="e.g. 50 or -50"
                                                            value={coinAdjust.amount}
                                                            onChange={e => setCoinAdjust(p => ({ ...p, amount: e.target.value }))}
                                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyberNeon transition-all text-center font-orbitron font-bold"
                                                        />
                                                        <button
                                                            onClick={() => setCoinAdjust(p => ({ ...p, amount: p.amount && !p.amount.startsWith('-') ? '-' + p.amount : p.amount }))}
                                                            className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                                                            title="Deduct coins"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-gray-500 text-[10px] font-mono uppercase tracking-widest block mb-1.5">Reason (optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Compensation, contest reward..."
                                                        value={coinAdjust.reason}
                                                        onChange={e => setCoinAdjust(p => ({ ...p, reason: e.target.value }))}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyberNeon transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleCoinAdjust}
                                                    disabled={coinAdjust.loading || coinAdjust.amount === ''}
                                                    className="w-full py-3 bg-cyberNeon text-black font-orbitron font-black text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <Coins size={13} /> {coinAdjust.loading ? 'PROCESSING...' : 'APPLY ADJUSTMENT'}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-10 text-center text-gray-600">
                                            <Coins size={36} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-xs font-mono">Select a user from the leaderboard to manually adjust their Twin Coin balance.</p>
                                        </div>
                                    )}
                                </div>

                                {selectedCoinUser && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel p-6 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-4"
                                    >
                                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                                            <Activity className="text-cyberBlue" size={16} /> ACTIVITY LOG
                                            <span className="text-gray-500 font-inter font-normal text-[10px] ml-1">â€” {selectedCoinUser.username}</span>
                                        </h3>
                                        <div className="space-y-2 font-mono text-[10px]">
                                            {[
                                                { label: 'Last Check-in', value: selectedCoinUser.activityLog.lastCheckin || 'Never', color: '#00e5ff' },
                                                { label: 'Last Simulator Run', value: selectedCoinUser.activityLog.lastScenario || 'Never', color: '#ff5a00' },
                                                { label: 'Last Journal Entry', value: selectedCoinUser.activityLog.lastJournal || 'Never', color: '#a200ff' },
                                                { label: 'Last Chat Interaction', value: selectedCoinUser.activityLog.lastChat || 'Never', color: '#00ffaa' },
                                                { label: 'Scenarios Today', value: `${selectedCoinUser.activityLog.scenarioToday}/2`, color: '#ff5a00' },
                                                { label: 'Journals Today', value: `${selectedCoinUser.activityLog.journalToday}/3`, color: '#a200ff' },
                                                { label: 'Chats Today', value: `${selectedCoinUser.activityLog.chatToday}/5`, color: '#00ffaa' },
                                                { label: 'Goals Completed (All Time)', value: selectedCoinUser.activityLog.goalsCompleted, color: '#f59e0b' },
                                                { label: 'Current Streak', value: `${selectedCoinUser.currentStreak} days`, color: '#f59e0b' },
                                                { label: 'XP (current level)', value: `${selectedCoinUser.xp} XP`, color: '#a200ff' },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between items-center p-2.5 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-gray-400">{row.label}:</span>
                                                    <span className="font-bold" style={{ color: row.color }}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                            <Database size={16} className="text-cyberBlue" /> DATABASE STORAGE
                        </h3>
                        <div className="space-y-4 font-mono text-xs">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Database Type:</span>
                                <span className="text-green-400 font-bold">MongoDB Atlas</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Total Users:</span>
                                <span className="text-white font-bold">{stats?.totalUsers || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Server Port:</span>
                                <span className="text-cyberBlue font-bold">PORT 3000</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Time Sync Status:</span>
                                <span className="text-cyberNeon font-bold">Online</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Live Clock:</span>
                                <span className="text-cyberPink font-bold flex items-center gap-1"><Clock size={10} /> {systemTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                            <Cpu size={16} className="text-cyberPink" /> NODE.JS / V8 ENGINE
                        </h3>
                        <div className="space-y-4 font-mono text-xs">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">RSS Memory:</span>
                                <span className="text-white font-bold">{stats?.rssMB || 0} MB</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Heap Used:</span>
                                <span className="text-white font-bold">{stats?.heapUsedMB || 0} MB</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Heap Total limit:</span>
                                <span className="text-[#a200ff] font-bold">{stats?.heapTotalMB || 0} MB</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-gray-400">Uptime:</span>
                                <span className="text-green-400 font-bold">{stats?.uptimeFormatted || '0s'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-[#0d0714]/20 space-y-6">
                        <h3 className="font-orbitron font-bold text-sm tracking-wider flex items-center gap-2">
                            <Server size={16} className="text-cyberNeon" /> SYSTEM OPERATIONS
                        </h3>
                        <div className="space-y-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await axios.post(`${API_BASE}/admin/clear-cache`, {}, axiosConfig);
                                        setRefreshTrigger(prev => prev + 1);
                                        showToast(res.data.msg || 'Server memory cache successfully cleared');
                                    } catch (err) {
                                        showToast(err.response?.data?.msg || 'Failed to clear server cache', 'error');
                                    }
                                }}
                                className="w-full py-3 rounded-xl bg-cyberNeon text-[#050308] hover:bg-white font-orbitron font-black text-xs transition-all uppercase tracking-widest"
                            >
                                Clear Server Cache
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await axios.post(`${API_BASE}/admin/system-integrity`, {}, axiosConfig);
                                        showToast(res.data.msg || 'All system integrity protocols are valid', res.data.status === 'HEALTHY' ? 'success' : 'error');
                                    } catch (err) {
                                        showToast('System integrity check failed', 'error');
                                    }
                                }}
                                className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-orbitron font-semibold text-xs transition-all uppercase tracking-widest"
                            >
                                Verify System Integrity
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-[#0d0714] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${confirmModal.isDanger ? 'bg-red-500/20 border border-red-500/30' : 'bg-cyberNeon/20 border border-cyberNeon/30'}`}>
                                <AlertCircle size={22} className={confirmModal.isDanger ? 'text-red-400' : 'text-cyberNeon'} />
                            </div>
                            <h3 className="font-orbitron font-black text-white text-lg mb-2">{confirmModal.title}</h3>
                            <p className="text-gray-400 font-inter text-sm leading-relaxed mb-7">{confirmModal.message}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-orbitron font-bold text-xs hover:bg-white/5 transition-all uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirmModal.onConfirm) await confirmModal.onConfirm();
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    }}
                                    className={`flex-1 py-3 rounded-xl font-orbitron font-black text-xs transition-all uppercase tracking-widest ${confirmModal.isDanger ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-cyberNeon hover:bg-white text-black'}`}
                                >
                                    {confirmModal.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminHub;


