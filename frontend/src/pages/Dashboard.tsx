import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Sun, Moon, Globe, LogOut, BarChart3, UserPlus, 
  Users, Ticket, Award, Calendar, Filter, RefreshCw, FileDown, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import RegisterUser from './RegisterUser';

const STATS_URL = '/api/visitantes/stats';
const REPORT_URL = '/api/visitantes/report';

const COLORS = ['#854d0e', '#ca8a04', '#0d9488', '#2563eb'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Authentication check
  const [user, setUser] = useState<{ nombre: string; correo: string } | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      localStorage.clear();
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState<'stats' | 'register'>('stats');

  // Filters State
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    tipo_procedencia: ''
  });

  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stats Data
  const fetchStats = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.tipo_procedencia) params.append('tipo_procedencia', filters.tipo_procedencia);

      const res = await axios.get(`${STATS_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setStatsData(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filters.tipo_procedencia]); // Auto reload on origin type select, button for dates

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      tipo_procedencia: ''
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.tipo_procedencia) params.append('tipo_procedencia', filters.tipo_procedencia);

      const response = await axios.get(`${REPORT_URL}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-museo-visitantes-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report', err);
      alert('Error al descargar reporte en PDF.');
    }
  };

  // Find max value in detailed origins for heatmap progress-bar scaling
  const maxOriginVal = statsData?.procedenciaDetalle?.length > 0 
    ? Math.max(...statsData.procedenciaDetalle.map((o: any) => o.value)) 
    : 100;

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 md:h-screen bg-white dark:bg-zinc-900 border-r border-b md:border-b-0 border-zinc-200/80 dark:border-zinc-800/80 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-700 dark:bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
              FV
            </div>
            <div>
              <h1 className="font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                {t('common.appName')}
              </h1>
              <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-500 font-semibold">
                Panel Administrativo
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-500 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              {t('dashboard.nav.stats')}
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-500 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              <UserPlus className="h-5 w-5" />
              {t('dashboard.nav.registerUser')}
            </button>


          </nav>
        </div>

        {/* User profile & Actions */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-300">
              {user?.nombre?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {user?.nombre || 'Admin'}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {user?.correo || 'admin@museo.com'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-zinc-100/50 dark:bg-zinc-950/50 p-1.5 rounded-xl">
            {/* Lang switcher */}
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer"
              title={t('common.language')}
            >
              <Globe className="h-4.5 w-4.5" />
            </button>

            {/* Theme switcher */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer"
              title={t('common.theme')}
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
              title={t('common.logout')}
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        {/* Statistics Dashboard View */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                  {t('dashboard.nav.stats')}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Monitoreo de ingresos y demografía de los visitantes en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Refresh / Filter trigger */}
                <button 
                  onClick={fetchStats}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>

                {/* PDF generation trigger */}
                <button 
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  Descargar PDF
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-300 flex items-center gap-3 animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Filter Form bar */}
            <form onSubmit={handleApplyFilters} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {t('dashboard.filters.startDate')}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {t('dashboard.filters.endDate')}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  {t('dashboard.filters.originType')}
                </label>
                <select
                  value={filters.tipo_procedencia}
                  onChange={(e) => setFilters(prev => ({ ...prev, tipo_procedencia: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none"
                >
                  <option value="">{t('dashboard.filters.all')}</option>
                  <option value="Local">{t('visitorForm.local')}</option>
                  <option value="Nacional">{t('visitorForm.national')}</option>
                  <option value="Internacional">{t('visitorForm.international')}</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Filter className="h-4 w-4" />
                  {t('dashboard.filters.apply')}
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="py-2 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  {t('dashboard.filters.clear')}
                </button>
              </div>
            </form>

            {/* KPI Cards Grid */}
            {statsData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Visitors */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 transition-all">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block">{t('dashboard.kpis.totalVisitors')}</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{statsData.kpis.totalVisitors}</span>
                  </div>
                </div>

                {/* Total Groups */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 transition-all">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded-xl">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block">{t('dashboard.kpis.totalGroups')}</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{statsData.kpis.totalGroups}</span>
                  </div>
                </div>

                {/* Avg group size */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 transition-all">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded-xl">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block">{t('dashboard.kpis.avgGroupSize')}</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{statsData.kpis.promedioGrupo}</span>
                  </div>
                </div>

                {/* Date Filter summary */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex items-center gap-4 transition-all">
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded-xl">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block">Hombres / Mujeres</span>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {statsData.kpis.totalHombres} H / {statsData.kpis.totalMujeres} M
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Grid Layout */}
            {statsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Demografía Bar Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-6 uppercase tracking-wider">
                    {t('dashboard.charts.demographics')}
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statsData.demografia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-800/40" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {statsData.demografia.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Gender distribution Pie Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-6 uppercase tracking-wider">
                    {t('dashboard.charts.gender')}
                  </h3>
                  <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-around">
                    <div className="h-56 w-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statsData.genero}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statsData.genero.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4 sm:mt-0">
                      {statsData.genero.map((entry: any, i: number) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[(i + 1) % COLORS.length] }} />
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                            {entry.name}: {entry.value} ({statsData.kpis.totalVisitors > 0 ? ((entry.value / statsData.kpis.totalVisitors) * 100).toFixed(0) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Trend Line Chart */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col lg:col-span-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-6 uppercase tracking-wider">
                    {t('dashboard.charts.visitsOverTime')}
                  </h3>
                  <div className="h-72 w-full">
                    {statsData.tendenciaVisitas.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                        No hay datos suficientes para mostrar la tendencia de visitas en este rango.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statsData.tendenciaVisitas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-800/40" />
                          <XAxis dataKey="fecha" stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="total" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 4. Origin heatmap representation */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2 uppercase tracking-wider">
                    {t('dashboard.charts.heatmap')}
                  </h3>
                  <div className="max-h-80 overflow-y-auto space-y-3.5 pr-2">
                    {statsData.procedenciaDetalle.length === 0 ? (
                      <div className="text-center py-10 text-zinc-400 text-sm">
                        No hay datos de procedencia.
                      </div>
                    ) : (
                      statsData.procedenciaDetalle.map((item: any) => {
                        const pct = (item.value / maxOriginVal) * 100;
                        return (
                          <div key={item.location} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-zinc-700 dark:text-zinc-300">{item.location}</span>
                              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{item.value} {t('dashboard.kpis.totalVisitors')}</span>
                            </div>
                            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-amber-700 to-amber-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent records simple table */}
            {statsData && statsData.rawRecords.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4 uppercase tracking-wider">
                  {t('dashboard.recentRecords')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-850 text-zinc-400 uppercase tracking-wider font-semibold">
                        <th className="pb-3 pr-4">Folio</th>
                        <th className="pb-3 pr-4">Visitante</th>
                        <th className="pb-3 pr-4 text-center">Total</th>
                        <th className="pb-3 pr-4 text-center">H / M</th>
                        <th className="pb-3 pr-4">Procedencia</th>
                        <th className="pb-3 text-right">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                      {statsData.rawRecords.slice(0, 10).map((row: any) => (
                        <tr key={row.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20">
                          <td className="py-3 pr-4 font-semibold text-zinc-950 dark:text-zinc-50">{row.folio_boleto}</td>
                          <td className="py-3 pr-4 truncate max-w-[150px]">{row.nombre_visitante}</td>
                          <td className="py-3 pr-4 text-center font-bold">{row.num_personas}</td>
                          <td className="py-3 pr-4 text-center text-zinc-400">{row.hombres}H / {row.mujeres}M</td>
                          <td className="py-3 pr-4 font-semibold">
                            {row.tipo_procedencia === 'Local' && row.municipio ? `${row.municipio}, Dgo` : row.procedencia}
                          </td>
                          <td className="py-3 text-right text-zinc-400">
                            {new Date(row.fecha).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Registration View */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                {t('dashboard.nav.registerUser')}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Creación interna de credenciales para el personal.
              </p>
            </div>
            <RegisterUser />
          </div>
        )}


      </main>
    </div>
  );
}
