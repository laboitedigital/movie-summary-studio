import { MovieClip } from "./types";

export const FALLBACK_CATALOG: MovieClip[] = [
  // INCEPTION
  {
    id: "inc-1",
    url: "https://clip.cafe/inception-2010/we-need-to-go-deeper/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-spinning-spinning-top-close-up-44284-large.mp4",
    quote: "We need to go deeper.",
    movie: "Inception (2010)",
    duration: 5,
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop"
  },
  {
    id: "inc-2",
    url: "https://clip.cafe/inception-2010/what-is-the-most-resilient-parasite/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-spinning-spinning-top-close-up-44284-large.mp4",
    quote: "An idea. Resilient. Highly contagious.",
    movie: "Inception (2010)",
    duration: 6,
    thumbnail: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop"
  },
  {
    id: "inc-3",
    url: "https://clip.cafe/inception-2010/youre-waiting-for-a-train/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-spinning-spinning-top-close-up-44284-large.mp4",
    quote: "You're waiting for a train. A train that will take you far away.",
    movie: "Inception (2010)",
    duration: 8,
    thumbnail: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&auto=format&fit=crop"
  },

  // THE MATRIX
  {
    id: "mat-1",
    url: "https://clip.cafe/the-matrix-1999/there-is-no-spoon/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-matrix-code-background-39755-large.mp4",
    quote: "Do not try and bend the spoon, that's impossible. Instead, only try to realize the truth... there is no spoon.",
    movie: "The Matrix (1999)",
    duration: 8,
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop"
  },
  {
    id: "mat-2",
    url: "https://clip.cafe/the-matrix-1999/take-the-blue-pill-or-the-red-pill/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-matrix-code-background-39755-large.mp4",
    quote: "You take the blue pill, the story ends. You take the red pill, you stay in Wonderland, and I show you how deep the rabbit hole goes.",
    movie: "The Matrix (1999)",
    duration: 10,
    thumbnail: "https://images.unsplash.com/photo-1584036561566-baf241f2c44e?w=400&auto=format&fit=crop"
  },
  {
    id: "mat-3",
    url: "https://clip.cafe/the-matrix-1999/i-know-kung-fu/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-digital-matrix-code-background-39755-large.mp4",
    quote: "I know Kung Fu.",
    movie: "The Matrix (1999)",
    duration: 4,
    thumbnail: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&auto=format&fit=crop"
  },

  // TITANIC
  {
    id: "tit-1",
    url: "https://clip.cafe/titanic-1997/im-the-king-of-the-world/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-ocean-waves-under-a-sunset-sky-41581-large.mp4",
    quote: "I'm the king of the world!",
    movie: "Titanic (1997)",
    duration: 5,
    thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop"
  },
  {
    id: "tit-2",
    url: "https://clip.cafe/titanic-1997/ill-never-let-go/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-ocean-waves-under-a-sunset-sky-41581-large.mp4",
    quote: "I'll never let go, Jack. I'll never let go.",
    movie: "Titanic (1997)",
    duration: 6,
    thumbnail: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&auto=format&fit=crop"
  },

  // THE DARK KNIGHT / JOKER
  {
    id: "tdk-1",
    url: "https://clip.cafe/the-dark-knight-2008/why-so-serious/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-rain-on-a-window-at-night-42289-large.mp4",
    quote: "Why so serious? Let's put a smile on that face!",
    movie: "The Dark Knight (2008)",
    duration: 7,
    thumbnail: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&auto=format&fit=crop"
  },
  {
    id: "tdk-2",
    url: "https://clip.cafe/the-dark-knight-2008/you-either-die-a-hero-or-you-live-long-enough-to-see-yourself-become-the-villain/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-rain-on-a-window-at-night-42289-large.mp4",
    quote: "You either die a hero, or you live long enough to see yourself become the villain.",
    movie: "The Dark Knight (2008)",
    duration: 8,
    thumbnail: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400&auto=format&fit=crop"
  },

  // STAR WARS
  {
    id: "sw-1",
    url: "https://clip.cafe/star-wars-episode-v-the-empire-strikes-back/i-am-your-father/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
    quote: "No, I am your father.",
    movie: "Star Wars: The Empire Strikes Back (1980)",
    duration: 5,
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop"
  },
  {
    id: "sw-2",
    url: "https://clip.cafe/star-wars-episode-iv-a-new-hope/may-the-force-be-with-you/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
    quote: "May the Force be with you.",
    movie: "Star Wars: A New Hope (1977)",
    duration: 4,
    thumbnail: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&auto=format&fit=crop"
  },

  // INTERSTELLAR
  {
    id: "int-1",
    url: "https://clip.cafe/interstellar-2014/cooper-this-is-no-time-for-caution/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-clock-moving-fast-41577-large.mp4",
    quote: "Cooper, this is no time for caution!",
    movie: "Interstellar (2014)",
    duration: 6,
    thumbnail: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=400&auto=format&fit=crop"
  },
  {
    id: "int-2",
    url: "https://clip.cafe/interstellar-2014/we-used-to-look-up-at-the-sky/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4",
    quote: "We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.",
    movie: "Interstellar (2014)",
    duration: 9,
    thumbnail: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&auto=format&fit=crop"
  },

  // FORREST GUMP
  {
    id: "fg-1",
    url: "https://clip.cafe/forrest-gump-1994/life-is-like-a-box-of-chocolates/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-walking-alone-in-a-forest-42291-large.mp4",
    quote: "My mama always said life was like a box of chocolates. You never know what you're gonna get.",
    movie: "Forrest Gump (1994)",
    duration: 9,
    thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&auto=format&fit=crop"
  },
  {
    id: "fg-2",
    url: "https://clip.cafe/forrest-gump-1994/run-forrest-run/",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-walking-alone-in-a-forest-42291-large.mp4",
    quote: "Run, Forrest! Run!",
    movie: "Forrest Gump (1994)",
    duration: 4,
    thumbnail: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop"
  }
];

export function getFallbackClips(query: string): MovieClip[] {
  if (!query) return FALLBACK_CATALOG;
  const normalizedQuery = query.toLowerCase();
  return FALLBACK_CATALOG.filter(clip => 
    clip.movie.toLowerCase().includes(normalizedQuery) ||
    clip.quote.toLowerCase().includes(normalizedQuery) ||
    clip.id.toLowerCase().includes(normalizedQuery)
  );
}
