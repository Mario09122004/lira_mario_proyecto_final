import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { z } from 'zod';
import { MEXICAN_STATES, DURANGO_MUNICIPALITIES, COUNTRIES } from '../data/locations';

const API_URL = '/api/visitantes';

// Zod validation schema for frontend (matching backend rules)
const visitorFormSchema = z.object({
  folio_boleto: z.string().min(1, "El folio es requerido"),
  nombre_visitante: z.string().min(1, "El nombre es requerido"),
  num_personas: z.number().int().positive("El número de personas debe ser mayor a 0"),
  hombres: z.number().int().nonnegative("No puede ser negativo"),
  mujeres: z.number().int().nonnegative("No puede ser negativo"),
  ninos: z.number().int().nonnegative("No puede ser negativo"),
  jovenes: z.number().int().nonnegative("No puede ser negativo"),
  adultos: z.number().int().nonnegative("No puede ser negativo"),
  tercera_edad: z.number().int().nonnegative("No puede ser negativo"),
  tipo_procedencia: z.enum(["Local", "Nacional", "Internacional"]),
  procedencia: z.string().min(1, "La procedencia es requerida"),
  municipio: z.string().nullable().optional()
});

export default function VisitorForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
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

  // Form State
  const [formData, setFormData] = useState({
    folio_boleto: '',
    nombre_visitante: '',
    num_personas: 1,
    hombres: 0,
    mujeres: 0,
    ninos: 0,
    jovenes: 0,
    adultos: 0,
    tercera_edad: 0,
    tipo_procedencia: 'Local' as 'Local' | 'Nacional' | 'Internacional',
    procedencia: 'Durango',
    municipio: ''
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update procedencia based on type selection
  useEffect(() => {
    if (formData.tipo_procedencia === 'Local') {
      setFormData(prev => ({ ...prev, procedencia: 'Durango', municipio: DURANGO_MUNICIPALITIES[0] }));
    } else if (formData.tipo_procedencia === 'Nacional') {
      // Prefill with first national state that is not Durango (e.g. Chihuahua)
      const firstState = MEXICAN_STATES.find(s => s !== 'Durango') || MEXICAN_STATES[0];
      setFormData(prev => ({ ...prev, procedencia: firstState, municipio: '' }));
    } else {
      setFormData(prev => ({ ...prev, procedencia: COUNTRIES[0], municipio: '' }));
    }
  }, [formData.tipo_procedencia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (['num_personas', 'hombres', 'mujeres', 'ninos', 'jovenes', 'adultos', 'tercera_edad'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setValidationError(null);
  };

  const handleLangToggle = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(false);

    // Front-end validations
    const genderSum = formData.hombres + formData.mujeres;
    const ageSum = formData.ninos + formData.jovenes + formData.adultos + formData.tercera_edad;

    if (genderSum !== formData.num_personas) {
      setValidationError(i18n.language === 'es' 
        ? `La suma de hombres (${formData.hombres}) y mujeres (${formData.mujeres}) debe ser igual al total de personas (${formData.num_personas}).`
        : `The sum of men (${formData.hombres}) and women (${formData.mujeres}) must equal the total number of people (${formData.num_personas}).`
      );
      return;
    }

    if (ageSum !== formData.num_personas) {
      setValidationError(i18n.language === 'es'
        ? `La suma de las edades (${ageSum}) debe ser igual al total de personas (${formData.num_personas}).`
        : `The sum of age groups (${ageSum}) must equal the total number of people (${formData.num_personas}).`
      );
      return;
    }

    try {
      // Validate schema
      visitorFormSchema.parse(formData);

      setLoading(true);
      const res = await axios.post(API_URL, formData);
      if (res.data.success) {
        setSuccess(true);
        // Reset form
        setFormData({
          folio_boleto: '',
          nombre_visitante: '',
          num_personas: 1,
          hombres: 0,
          mujeres: 0,
          ninos: 0,
          jovenes: 0,
          adultos: 0,
          tercera_edad: 0,
          tipo_procedencia: 'Local',
          procedencia: 'Durango',
          municipio: DURANGO_MUNICIPALITIES[0]
        });
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setValidationError(err.issues[0].message);
      } else {
        setValidationError(err.response?.data?.message || 'Error de conexión con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col transition-colors duration-200">
      {/* Header / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-700 dark:bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            FV
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('common.appName')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={handleLangToggle}
            className="p-2.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title={t('common.language')}
            aria-label="Change Language"
          >
            <Globe className="h-5 w-5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title={t('common.theme')}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Login button */}
          <button
            onClick={() => navigate('/login')}
            className="ml-2 px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            {t('common.login')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden transition-all">
          <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-8 py-6 text-white text-center">
            <h1 className="text-2xl font-bold">{t('visitorForm.title')}</h1>
            <p className="text-amber-100/90 text-sm mt-1">{t('visitorForm.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{t('visitorForm.successMsg')}</span>
              </div>
            )}

            {validationError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-800 dark:text-red-300 flex items-center gap-3 animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{validationError}</span>
              </div>
            )}

            {/* Basic fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  {t('visitorForm.ticketFolio')} *
                </label>
                <input
                  type="text"
                  name="folio_boleto"
                  required
                  value={formData.folio_boleto}
                  onChange={handleChange}
                  placeholder="e.g. F-10492"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  {t('visitorForm.visitorName')} *
                </label>
                <input
                  type="text"
                  name="nombre_visitante"
                  required
                  value={formData.nombre_visitante}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* People count */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                {t('visitorForm.numPeople')} *
              </label>
              <input
                type="number"
                name="num_personas"
                min="1"
                required
                value={formData.num_personas}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              />
            </div>

            {/* Gender breakdown */}
            <div className="p-5 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                {t('visitorForm.genderBreakdown')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.men')}</label>
                  <input
                    type="number"
                    name="hombres"
                    min="0"
                    value={formData.hombres}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.women')}</label>
                  <input
                    type="number"
                    name="mujeres"
                    min="0"
                    value={formData.mujeres}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Age breakdown */}
            <div className="p-5 border border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                {t('visitorForm.ageBreakdown')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.children')}</label>
                  <input
                    type="number"
                    name="ninos"
                    min="0"
                    value={formData.ninos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.youth')}</label>
                  <input
                    type="number"
                    name="jovenes"
                    min="0"
                    value={formData.jovenes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.adults')}</label>
                  <input
                    type="number"
                    name="adultos"
                    min="0"
                    value={formData.adultos}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('visitorForm.elderly')}</label>
                  <input
                    type="number"
                    name="tercera_edad"
                    min="0"
                    value={formData.tercera_edad}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Origin configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  {t('visitorForm.originType')}
                </label>
                <select
                  name="tipo_procedencia"
                  value={formData.tipo_procedencia}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Local">{t('visitorForm.local')}</option>
                  <option value="Nacional">{t('visitorForm.national')}</option>
                  <option value="Internacional">{t('visitorForm.international')}</option>
                </select>
              </div>

              {/* Conditional Location selectors */}
              {formData.tipo_procedencia === 'Local' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    {t('visitorForm.municipality')} *
                  </label>
                  <select
                    name="municipio"
                    value={formData.municipio}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DURANGO_MUNICIPALITIES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.tipo_procedencia === 'Nacional' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    {t('visitorForm.state')} *
                  </label>
                  <select
                    name="procedencia"
                    value={formData.procedencia}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {MEXICAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.tipo_procedencia === 'Internacional' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    {t('visitorForm.country')} *
                  </label>
                  <select
                    name="procedencia"
                    value={formData.procedencia}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-6 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? t('common.loading') : t('visitorForm.submit')}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} {t('common.appName')}. {t('common.appName') === 'Museo Francisco Villa' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
      </footer>
    </div>
  );
}
