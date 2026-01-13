import { useState, useEffect, useMemo } from 'react'
import { 
  Wind, Droplets, Thermometer, RefreshCw, Smile, Frown, Meh, 
  TrendingUp, MapPin, Github, Linkedin, CloudRain, CloudSun, 
  Sun, X, Info 
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [clima, setClima] = useState({
    cidade: "Manaus",
    aqi: 0, temp: 0, umidade: 0, vento: 0,
    status: "Carregando...", tipo: "neutro",
    historico: [], previsao: []
  })

  const LAT = -3.119
  const LON = -60.021

  const uiConfig = useMemo(() => {
    const { aqi } = clima
    if (loading) return { color: '#FFF', icon: <RefreshCw className="spin"/> }
    if (aqi <= 50) return { color: '#10b981', icon: <Smile size={32} /> }
    if (aqi <= 100) return { color: '#f59e0b', icon: <Meh size={32} /> }
    return { color: '#ef4444', icon: <Frown size={32} /> }
  }, [clima.aqi, loading])

  const getWeatherIcon = (code) => {
    if (code <= 1) return <Sun size={20} />
    if (code <= 3) return <CloudSun size={20} />
    return <CloudRain size={20} />
  }

  const buscarDadosReais = async () => {
    setLoading(true)
    try {
      const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weathercode&timezone=America%2FManaus`
      const urlAr = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=us_aqi&hourly=us_aqi&past_days=1&forecast_days=0&timezone=America%2FManaus`

      const [resClima, resAr] = await Promise.all([fetch(urlClima), fetch(urlAr)])
      const dadosClima = await resClima.json()
      const dadosAr = await resAr.json()

      const aqi = dadosAr.current.us_aqi
      let statusTexto = "Bom"
      let tipoTema = "bom"

      if (aqi > 50 && aqi <= 100) { 
        statusTexto = "Moderado"; tipoTema = "neutro" 
      } else if (aqi > 100) { 
        statusTexto = "Insalubre"; tipoTema = "ruim" 
      }

      const horasRaw = dadosAr.hourly.time.slice(-24)
      const aqiRaw = dadosAr.hourly.us_aqi.slice(-24)
      const dadosGrafico = horasRaw.map((hora, index) => ({
        hora: hora.split('T')[1].slice(0, 2) + 'h',
        aqi: aqiRaw[index]
      }))

      const currentHourIndex = new Date().getHours()
      const next5Hours = dadosClima.hourly.time.slice(currentHourIndex, currentHourIndex + 6)
      
      const dadosPrevisao = next5Hours.map((hora, i) => {
        const indexReal = currentHourIndex + i
        return {
          hora: hora.split('T')[1].slice(0, 5),
          temp: Math.round(dadosClima.hourly.temperature_2m[indexReal]),
          chuva: dadosClima.hourly.precipitation_probability[indexReal],
          code: dadosClima.hourly.weathercode[indexReal]
        }
      })

      setClima({
        cidade: "Manaus - AM",
        aqi: aqi,
        temp: Math.round(dadosClima.current.temperature_2m),
        umidade: dadosClima.current.relative_humidity_2m,
        vento: dadosClima.current.wind_speed_10m,
        status: statusTexto, tipo: tipoTema,
        historico: dadosGrafico, previsao: dadosPrevisao
      })

    } catch (erro) {
      console.error("Erro API:", erro)
      setClima(prev => ({...prev, status: "Offline"}))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { buscarDadosReais() }, [])

  const getHealthAdvice = () => {
    if (clima.tipo === 'bom') return ["Ambiente seguro: Pode sair.", "Ventilação: Abra janelas.", "Geral: Tudo tranquilo."]
    if (clima.tipo === 'neutro') return ["Atenção: Asma/Rinite cuidado.", "Olho vivo: Tempo mudando.", "Exercícios: Com moderação."]
    return ["Perigo: Fique em casa.", "Proteção: Use máscara.", "Casa: Feche tudo e hidrate-se."]
  }

  return (
    <div className="layout-wrapper">
      <div className="background-blobs">
        <motion.div 
          className={`blob blob-1 ${clima.tipo}`} 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 10, repeat: Infinity }}
        />
        <div className="blob blob-2"></div>
      </div>

      <div className="dashboard-container">
        <motion.nav 
          className="navbar glass-card"
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}
        >
          <span className="brand">EcoMonitor<span style={{color: uiConfig.color}}>.Pro</span></span>
          <button className="btn-icon" onClick={buscarDadosReais} disabled={loading}>
             <RefreshCw size={20} className={loading ? 'spin' : ''} /> 
          </button>
        </motion.nav>

        <main className="grid-layout">
          <motion.section className="hero-card glass-card" layout>
            <header className="hero-header">
              <div className="location">
                <MapPin size={16} style={{color: uiConfig.color}} /> 
                <span>{clima.cidade}</span>
              </div>
              <motion.button 
                className="status-pill btn-advice"
                style={{ backgroundColor: `${uiConfig.color}15`, color: uiConfig.color, border: `1px solid ${uiConfig.color}30` }}
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <Info size={14} style={{marginRight: 6}}/> Recomendações
              </motion.button>
            </header>
            
            <div className="aqi-display">
              <h1 className="aqi-number">{clima.aqi}</h1>
              <div className="aqi-icon" style={{color: uiConfig.color}}>
                {uiConfig.icon}
              </div>
            </div>
            <p className="aqi-label">Índice AQI (US Standard)</p>
          </motion.section>

          <div className="details-column">
            <section className="forecast-row glass-card">
              <h3 className="section-title">Previsão (Próximas Horas)</h3>
              <div className="forecast-scroll">
                {clima.previsao.map((item, i) => (
                  <div key={i} className="forecast-item">
                    <span className="forecast-time">{item.hora}</span>
                    <div className="forecast-icon" style={{color: uiConfig.color}}>
                      {getWeatherIcon(item.code)}
                    </div>
                    <span className="forecast-temp">{item.temp}°</span>
                    <span className="forecast-rain"><Droplets size={10}/> {item.chuva}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="stats-row">
              <div className="stat-card glass-card">
                <Thermometer size={20} className="stat-icon" />
                <span className="stat-value">{clima.temp}°</span>
                <span className="stat-label">Temp</span>
              </div>
              <div className="stat-card glass-card">
                <Droplets size={20} className="stat-icon" />
                <span className="stat-value">{clima.umidade}%</span>
                <span className="stat-label">Umid</span>
              </div>
              <div className="stat-card glass-card">
                <Wind size={20} className="stat-icon" />
                <span className="stat-value">{clima.vento}</span>
                <span className="stat-label">km/h</span>
              </div>
            </section>

            <section className="chart-card glass-card">
              <div className="chart-header">
                <TrendingUp size={16} style={{color: uiConfig.color}} />
                <h3>Tendência (24h)</h3>
              </div>
              <div style={{ width: '100%', height: 120 }}>
                <ResponsiveContainer>
                  <AreaChart data={clima.historico}>
                    <defs>
                      <linearGradient id="colorAqiDynamic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={uiConfig.color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={uiConfig.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hora" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} interval={4} />
                    <YAxis hide={true} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#1e1e24', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color:'#fff'}} 
                      itemStyle={{color: uiConfig.color}} 
                    />
                    <Area type="monotone" dataKey="aqi" stroke={uiConfig.color} strokeWidth={2} fillOpacity={1} fill="url(#colorAqiDynamic)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </main>

        <footer className="footer glass-card">
          <div className="dev-info">
            <span className="dev-label" style={{marginBottom: 4}}>Desenvolvido por</span>
            <div className="brand-logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="logo-icon">
                <path d="M4 24C4 24 8 20 18 20C23 20 26 22 26 22" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
                <path d="M6 16C6 16 10 12 18 12C22 12 24 14 24 14" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="26" cy="22" r="3" fill="#10b981"/>
              </svg>
              <span className="logo-text">TEAGA</span>
            </div>
          </div>
          <div className="social-links">
            <a href="https://github.com/TEAGGGA" target="_blank" className="social-btn"><Github size={18} /></a>
            <a href="https://linkedin.com/in/teagga" target="_blank" className="social-btn"><Linkedin size={18} /></a>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div 
              className="modal-content glass-card"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 style={{color: uiConfig.color, fontSize: '1.2rem'}}>Recomendações</h2>
                <button className="btn-close" onClick={() => setModalOpen(false)}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <p className="modal-intro">Status atual: <strong style={{color: uiConfig.color}}>{clima.status}</strong></p>
                <ul className="advice-list">
                  {getHealthAdvice().map((dica, i) => <li key={i}>{dica}</li>)}
                </ul>
              </div>
              <button className="btn-action" style={{backgroundColor: uiConfig.color}} onClick={() => setModalOpen(false)}>
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App