import { LanguageProvider } from './i18n/LanguageContext';
import { BookingProvider } from './hooks/useBooking';
import { ScrollThemeProvider } from './hooks/useScrollTheme';

import Nav from './components/Nav';
import ScrollProgress from './components/ScrollProgress';
import SmoothScroll from './components/SmoothScroll';

import Hero from './sections/Hero';
import Manifesto from './sections/Manifesto';
import Starlight from './sections/Starlight';
import ShootingStars from './sections/ShootingStars';
import Headliner from './sections/Headliner';
import FlowSeries from './sections/FlowSeries';
import Why from './sections/Why';
import Reel from './sections/Reel';
import Gallery from './sections/Gallery';
import Booking from './sections/Booking';
import Footer from './sections/Footer';

/**
 * One page, one scroll.
 *
 * Section order is the argument: the ceiling before the price, the price before
 * the reassurance, the reassurance before the form. The `data-theme` on each
 * section (declared inside the section itself) drives the background morph, so
 * reordering this list also reorders the light — nothing else needs touching.
 *
 *   Hero          dark    the sky
 *   Manifesto     light   the idea
 *   Starlight     dark    kits + live preview
 *   ShootingStars dark    the add-on that has to be seen moving
 *   Headliner     light   suede + pillar diagram
 *   FlowSeries    dark    the only colour on the site
 *   Why           smoke   four reasons
 *   Reel          dark    the wall of clips from the bay
 *   Gallery       dark    the work, in the shop's photographs
 *   Booking       light   three-step request
 *   Footer        dark    back under the sky
 */
export default function App() {
  return (
    <LanguageProvider>
      <BookingProvider>
        <ScrollThemeProvider>
          <SmoothScroll />
          <ScrollProgress />
          <Nav />

          <main>
            <Hero />
            <Manifesto />
            <Starlight />
            <ShootingStars />
            <Headliner />
            <FlowSeries />
            <Why />
            <Reel />
            <Gallery />
            <Booking />
          </main>

          <Footer />
        </ScrollThemeProvider>
      </BookingProvider>
    </LanguageProvider>
  );
}
