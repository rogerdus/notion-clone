export default function DashboardHome() {
  const categories = [
    "Oficios", "Documentos", "Secretarias", "Seguridad", "Agentes",
    "Trámites", "Uniformadas", "Expedientes", "Inspección", "Dependencias",
  ];

  const recommended = [
    { title: "Roger Deus: La entrevista que nadie esperaba", views: "2.4M", duration: "14:22" },
    { title: "Secretaria de Seguridad: Su día a día", views: "1.8M", duration: "28:15" },
    { title: "Documentación confidencial filtrada", views: "1.2M", duration: "8:47" },
    { title: "Agentes en acción: Operativo completo", views: "892K", duration: "42:08" },
    { title: "LAS MEJORES DEPENDENCIAS DE LA SECRETARÍA", views: "3.1M", duration: "52:30" },
    { title: "Inspección sorpresa: Así trabajan", views: "756K", duration: "18:45" },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[var(--bg-page)]">
      <div className="sticky top-0 z-10 bg-[var(--bg-page)] border-b border-[var(--border)] px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <span
              key={cat}
              className="flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-8">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-float text-7xl mb-4 drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 30px rgba(255, 165, 0, 0.3))" }}>
            🐉
          </div>
          <h2 className="animate-fade-in-up text-2xl font-bold mb-2 text-center" style={{ animationDelay: "0.1s" }}>
            <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Bienvenido Roger Deus
            </span>
          </h2>
          <p className="animate-fade-in-up text-sm text-[var(--text-muted)] text-center" style={{ animationDelay: "0.2s" }}>
            Secretaría de Seguridad y Protección Ciudadana
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">Recommended</span>
            <span className="text-[10px] text-[var(--text-dim)]">• Easter Egg</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recommended.map((video, i) => (
              <div key={i} className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-all duration-300 cursor-default">
                <div className="relative aspect-video bg-gradient-to-br from-[#ff9900]/10 to-[#1a1a1a] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-4xl opacity-20">📄</span>
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1 rounded font-mono">
                    {video.duration}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs text-[var(--text-secondary)] leading-tight line-clamp-2 font-medium">
                    {video.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-dim)] mt-1">{video.views} vistas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-6 py-3 flex items-center justify-between text-[10px] text-[var(--text-dim)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[var(--accent)] text-black font-black text-[8px] flex items-center justify-center">PH</span>
            NotionHub
          </span>
          <span>© 2026</span>
          <span>FAQ</span>
          <span>Términos</span>
          <span>Privacidad</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            140M usuarios activos
          </span>
          <span>|</span>
          <span>1M horas de contenido</span>
        </div>
      </div>
    </div>
  );
}
