import Image from "next/image";

export function SocialProof() {
  return (
    <section className="py-12 px-6 border-b border-white/5 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <p className="text-sm font-medium text-slate-500 mb-8 tracking-wide">
          TRUSTED BY 150+ GYMS AND FITNESS STUDIOS
        </p>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 group cursor-pointer transition-colors hover:text-white text-slate-400"
            >
              <Image
                src={`/assets/brand/logo${i}.jpg`}
                alt="gym logo"
                className="w-24 h-24 object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                width={96}
                height={96}
              />
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            {/* 5 Stars */}
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-primary fill-primary" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-xl md:text-2xl font-medium text-slate-300 leading-snug mb-6">
            "We automated 80% of our operations using GymFlow. It completely transformed how we manage members, billing, and our staff across three different locations."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-fullborder border-white/10 shrink-0">
              <Image alt="Owner Image" src="/assets/testimonial/person4.jpg" className="w-full h-full rounded-full" width={40} height={40} />             </div>
            <div className="text-left">
              <div className="text-white font-semibold text-sm">Sarah Jenkins</div>
              <div className="text-slate-500 text-xs">Owner, Elite Fitness Studio</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
