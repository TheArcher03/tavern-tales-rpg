import act1Peddler from '../../assets/images/characters/act1-peddler.webp'
import act3Hermit from '../../assets/images/characters/act3-hermit.webp'
import dagCarrow from '../../assets/images/characters/dag-carrow.webp'
import meva from '../../assets/images/characters/meva.webp'
import oldSella from '../../assets/images/characters/old-sella.webp'
import rell from '../../assets/images/characters/rell.webp'
import vesh from '../../assets/images/characters/vesh.webp'
import ashenCircleRaiders from '../../assets/images/creatures/ashen-circle-raiders.webp'
import ashenRaiderEnforcer from '../../assets/images/creatures/ashen-raider-enforcer.webp'
import mireLurker from '../../assets/images/creatures/mire-lurker.webp'
import scarWarden from '../../assets/images/creatures/scar-warden.webp'
import thornedStalker from '../../assets/images/creatures/thorned-stalker.webp'
import umbrask from '../../assets/images/creatures/umbrask.webp'
import act1Departure from '../../assets/images/settings/act1-departure.webp'
import millhavenAtNight from '../../assets/images/settings/millhaven-at-night.webp'
import thornwoodPath from '../../assets/images/settings/thornwood-path.webp'
import umbralScarRitualSite from '../../assets/images/settings/umbral-scar-ritual-site.webp'
import threeWardSeals from '../../assets/images/items/three-ward-seals.webp'

// Full-bleed backdrops for each act's chapter-break splash, keyed by that
// act's opening scene id (the only three scenes a chapter break ever
// fires for). Every entry here is a genuinely optional, best-effort
// addition — a scene id with no entry just renders without an image, so
// adding a new act later needs no changes here until art exists for it.
export const CHAPTER_BACKDROPS: Record<string, string> = {
  'act1-start': millhavenAtNight,
  'act2-start': thornwoodPath,
  'act3-start': umbralScarRitualSite,
}

// Inline illustrations shown alongside the current scene's narration —
// each keyed to the one scene where that creature/NPC/moment is first
// properly introduced, not every scene that goes on to mention them.
export const SCENE_IMAGES: Record<string, string> = {
  'act1-granary-fight': ashenCircleRaiders,
  'act1-interrogate': ashenRaiderEnforcer,
  'act1-miller-chat': dagCarrow,
  'act1-peddler': act1Peddler,
  'act1-departure': act1Departure,
  'act2-mire-creature': mireLurker,
  'act2-deepwoods-stalker': thornedStalker,
  'act2-free-captive': rell,
  'act2-find-sella': oldSella,
  'act2-vesh-confront': vesh,
  'act2-eavesdrop-won': threeWardSeals,
  'act3-open-trail-standoff-won': meva,
  'act3-causeway-guardian': scarWarden,
  'act3-umbrask-stirs': umbrask,
  'act3-hermit': act3Hermit,
}
