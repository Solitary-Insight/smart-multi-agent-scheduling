export function MinimalistAgentShimmer({ stage=[] }) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        {/* Abstract Timetable Grid */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-[240px]">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`h-6 rounded-md animate-pulse ${
                i % 3 === 0 ? "bg-primary/20" : "bg-muted/40"
              }`}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
              Analyzing Constraints
            </p>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground animate-in fade-in slide-in-from-bottom-1">
            {stage}
          </p>
        </div>
      </div>
    );
  }