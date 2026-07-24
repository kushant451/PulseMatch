import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PulseLine from '../components/PulseLine';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="font-mono text-xs tracking-widest text-blood uppercase mb-4">
          Every 2 seconds, someone needs blood
        </p>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-[1.05] mb-6">
          Find the nearest match<br />before it's too late.
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10">
          PulseMatch connects donors, blood banks, and hospitals in real time —
          sorted by distance, filtered by eligibility, tracked to expiry.
        </p>

        <div className="flex justify-center gap-3 mb-16">
          {user ? (
            <Link to="/search" className="bg-blood hover:bg-blood-dark text-paper font-medium rounded px-6 py-3 transition-colors">
              Start searching
            </Link>
          ) : (
            <>
              <Link to="/register" className="bg-blood hover:bg-blood-dark text-paper font-medium rounded px-6 py-3 transition-colors">
                Join as a donor
              </Link>
              <Link to="/login" className="border border-ink/20 hover:border-ink/40 font-medium rounded px-6 py-3 transition-colors">
                Log in
              </Link>
            </>
          )}
        </div>

        <PulseLine color="#0B1220" />
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-8 mt-12">
        <Feature
          num="Location"
          title="Nearest match, sorted by distance"
          desc="Geo-indexed search returns eligible donors or in-stock blood banks closest to the request — no manual searching."
        />
        <Feature
          num="Eligibility"
          title="90-day donation gap enforced"
          desc="Donors are only shown if they're medically eligible to give again, keeping every match usable."
        />
        <Feature
          num="Expiry"
          title="First-expiry-first-out stock"
          desc="Blood units are tracked from collection to their 42-day expiry, cutting down on wastage."
        />
      </section>
    </div>
  );
}

function Feature({ num, title, desc }) {
  return (
    <div className="border-t-2 border-blood pt-4">
      <p className="font-mono text-xs text-blood uppercase tracking-wide mb-2">{num}</p>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
