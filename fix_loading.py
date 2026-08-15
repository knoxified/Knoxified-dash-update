import re

with open('/app/applet/app/(dashboard)/automations/page.tsx', 'r') as f:
    content = f.read()

replacement = """  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="h-10 flex-1 max-w-md bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl p-6 flex flex-col h-[280px]">
              <div className="flex items-start justify-between mb-5">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse"></div>
                  <div>
                    <div className="h-5 w-32 bg-slate-200 dark:bg-white/5 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-16 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-5 w-9 rounded-full bg-slate-200 dark:bg-white/5 animate-pulse"></div>
              </div>
              
              <div className="space-y-2 mb-4 flex-1 mt-4">
                <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5 mt-auto">
                <div className="h-4 w-24 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }"""

old_str = """  if (loading) {
     return <div className="animate-pulse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/5 rounded-xl h-64 w-full"></div>;
  }"""

content = content.replace(old_str, replacement)

with open('/app/applet/app/(dashboard)/automations/page.tsx', 'w') as f:
    f.write(content)
