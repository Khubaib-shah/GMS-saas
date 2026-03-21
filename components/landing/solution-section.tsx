import { ArrowRight, CheckCircle2, CreditCard, Activity, CalendarDays, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-50"></div>
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-widest uppercase">
            THE SOLUTION
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Everything you need. <br /> In one place.
          </h2>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            GymFlow transforms chaos into automation. Move from spreadsheets and messy paper logs to a real-time smart dashboard that handles the heavy lifting for you.
          </p>

          <div className="space-y-4 mb-10">
            {[
              "Automated billing and payment reconciliation",
              "Real-time attendance tracking with smart access",
              "Centralized staff scheduling and member management",
              "Actionable financial insights and growth metrics"
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>

          <Button className="bg-white text-black hover:bg-slate-200 transition-colors rounded-lg font-semibold px-8 h-12 flex items-center justify-center gap-2 group">
            See the Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Bento Grid Features Showcase */}
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          
          {/* Top Wide Card: Payments */}
          <div className="col-span-2 bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full"></div>
            <div className="flex items-center justify-between mx-2 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <CreditCard className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Automated Billing</h3>
                  <p className="text-slate-500 text-xs">Zero dropped payments</p>
                </div>
              </div>
            </div>
            {/* Live Payment Feed Illusion */}
            <div className="space-y-3 relative z-10">
              {[
                { name: "Sarah J.", plan: "Pro Membership", amount: "$45.00" },
                { name: "Mike T.", plan: "Elite Athlete", amount: "$80.00" },
              ].map((payment, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(190,255,0,0.8)]"></div>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{payment.name}</div>
                      <div className="text-slate-500 text-xs">{payment.plan}</div>
                    </div>
                  </div>
                  <div className="text-primary font-mono text-sm font-semibold">{payment.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Left Card: Smart Access */}
          <div className="col-span-1 bg-slate-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500 flex flex-col justify-between aspect-square">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50"></div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-auto relative z-10 text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-white font-semibold text-lg leading-tight mb-1">Smart <br/> Access</h3>
              <p className="text-slate-500 text-xs">QR & RFID Integration</p>
            </div>
            
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-[30px]"></div>
          </div>

          {/* Bottom Right Card: Analytics */}
          <div className="col-span-1 bg-gradient-to-br from-primary/10 to-slate-900 border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(190,255,0,0.05)] group hover:-translate-y-1 transition-transform duration-500 flex flex-col justify-between aspect-square">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                +18%
              </div>
            </div>
            
            <div className="relative z-10 mt-6 box-border">
              <div className="text-3xl font-bold text-white mb-1">94%</div>
              <div className="text-slate-400 text-xs font-medium">Retention Rate</div>
            </div>

            {/* Mini Chart Lines */}
            <div className="absolute bottom-4 right-4 flex items-end gap-1 opacity-60">
               {[30, 50, 40, 70, 60, 100].map((h, i) => (
                 <div key={i} className="w-1.5 bg-primary rounded-t-sm" style={{ height: `${h / 3}px` }}></div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
