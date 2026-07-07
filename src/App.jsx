import { useEffect, useRef, useState } from "react";
import "./App.css";

const TOTAL_FRAMES = 89;

function framePath(i) {
  return `/video_frames_webp/web_video_${String(i).padStart(5, "0")}.webp`;
}

export default function App() {
  const canvasRef = useRef(null);
  const spacerRef = useRef(null);
  const inviteInfoRef = useRef(null);
  const framesRef = useRef([]);
  const autoScrolledRef = useRef(false);
  const audioStartedRef = useRef(false);
  const pianoRef = useRef(null);
  const birdsRef = useRef(null);
  const startAudioRef = useRef(() => {});
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    if (inviteInfoRef.current) inviteInfoRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frames = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loaded++;
        if (loaded === TOTAL_FRAMES && !cancelled) {
          framesRef.current = frames;
          setLoading(false);
        }
      };
      frames.push(img);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const piano = new Audio("/audio/piano.mp3");
    const birds = new Audio("/audio/birds.mp3");
    piano.loop = true;
    birds.loop = true;
    piano.volume = 1.0;
    birds.volume = 0.3;
    pianoRef.current = piano;
    birdsRef.current = birds;

    function startAudio() {
      if (audioStartedRef.current) return;
      audioStartedRef.current = true;
      piano
        .play()
        .then(() => {
          birds.play().catch(() => {});
        })
        .catch(() => {
          audioStartedRef.current = false;
        });
    }
    startAudioRef.current = startAudio;

    // Start on the first real input gesture that produces a scroll
    // (wheel/touchend/keydown/click fire synchronously as part of the
    // gesture, unlike the derived "scroll" event, so play() reliably
    // lands inside the browser's user-activation window. touchend rather
    // than touchstart/pointerdown — iOS Safari only treats a completed
    // tap as a confirmed gesture, not the start of what could become a
    // scroll, so any "down" event fires too early)
    window.addEventListener("wheel", startAudio, { passive: true });
    window.addEventListener("touchend", startAudio, { passive: true });
    window.addEventListener("keydown", startAudio);
    window.addEventListener("click", startAudio);

    return () => {
      piano.pause();
      birds.pause();
      window.removeEventListener("wheel", startAudio);
      window.removeEventListener("touchend", startAudio);
      window.removeEventListener("keydown", startAudio);
      window.removeEventListener("click", startAudio);
    };
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (pianoRef.current) pianoRef.current.muted = next;
    if (birdsRef.current) birdsRef.current.muted = next;
  }

  function handleUnlock() {
    startAudioRef.current();
    setClosing(true);
  }

  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const frames = framesRef.current;

    canvas.width = frames[0].naturalWidth;
    canvas.height = frames[0].naturalHeight;

    function drawFrame(index) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(frames[index], 0, 0);
    }

    drawFrame(0);

    let rafId = null;
    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const spacerHeight = spacerRef.current.offsetHeight;
        const maxScroll = spacerHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        const index = Math.min(
          Math.floor(progress * TOTAL_FRAMES),
          TOTAL_FRAMES - 1,
        );
        drawFrame(index);

        if (progress >= 1 && !autoScrolledRef.current) {
          autoScrolledRef.current = true;
          inviteInfoRef.current.style.pointerEvents = "auto";
          window.scrollTo({ top: spacerHeight, behavior: "smooth" });
        } else if (progress < 1) {
          autoScrolledRef.current = false;
          inviteInfoRef.current.style.pointerEvents = "none";
        }

        rafId = null;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [loading]);

  return (
    <>
      {!unlocked && (
        <div
          className={`tapToEnter${closing ? " fadeOut" : ""}`}
          onClick={handleUnlock}
          onTransitionEnd={() => setUnlocked(true)}
        >
          <p>Tap to Enter</p>
        </div>
      )}
      {loading && <div className="loading">Loading...</div>}
      <button
        className="audioToggle"
        onClick={toggleMute}
        aria-label={muted ? "Unmute audio" : "Mute audio"}
      >
        <span className="material-symbols-outlined">
          {muted ? "volume_off" : "volume_up"}
        </span>
      </button>
      <div className="scroll-spacer" ref={spacerRef}>
        <div className="sticky-container">
          <canvas ref={canvasRef} />
        </div>
      </div>
      {/* <img className="leftWall" src="/images/leftWall.png" />
      <img className="rightWall" src="/images/rightWall.png" /> */}
      <div className="paperTex">
        <img src="/images/paperTex.png" />
      </div>
      <div className="geoPat">
        <img src="/images/geePaperPattern.png" />
        <img src="/images/geePaperPattern.png" />
        <img src="/images/geePaperPattern.png" />
        <img src="/images/geePaperPattern.png" />

        <img src="/images/geePaperPattern.png" />
      </div>
      <div className="topDecor">
        <img src="/images/TopPat.png" />
      </div>
      <div className="topTree">
        <img src="/images/leftTree.png" />
        <img src="/images/rightTree.png" />
      </div>
      <div className="cornerPat">
        <img src="/images/cornerPat2.png" />
        <img src="/images/cornerPat1.png" />
      </div>
      <div className="bottomPat">
        <img src="/images/bottomPat.png" />
      </div>
      <div className="inviteInfo" ref={inviteInfoRef}>
        <div className="intro infoSection">
          <img className="dua" src="/images/prayer.png" />
          <p>
            in the name of Allah
            <br /> the most beneficial and merciful
          </p>
          <div className="BandG">
            <h1>Mrs. Shahnaz</h1>
            <p>&</p>
            <h1>Mr. Mahamadsharif Patil</h1>
          </div>
          <p>
            request the honor of your presence to celebrate the walima ceremony
            of our youngest son
          </p>
          <div className="scrollUp">
            <p>walima</p>
            <span className="material-symbols-outlined">arrow_downward</span>
          </div>
        </div>
        <div className="walima infoSection">
          <img src="/images/walimaFlo.png" />
          <div>
            {/* <p>for</p> */}
            <div className="hosts">
              <h1>Hidayat Patil</h1>
              <p>to</p>
              <h1>Asma Ibrahim</h1>
              <p>D/o. Mrs. Fatima & Mr. Mohammed Ibrahim</p>
            </div>
          </div>
          <div className="scrollUp">
            <p>details</p>
            <span className="material-symbols-outlined">arrow_downward</span>
          </div>
        </div>
        <div className="nikah infoSection">
          <img src="/images/detailFlo.png" />
          <div className="placeInfo">
            <p>dawat-e-walima</p>
            <div className="place">
              <h1>August 2nd, 2026</h1>
              <hr />
              <h1>12:00 PM</h1>
            </div>
          </div>
          <div className="placeInfo">
            <p>Address At</p>
            <div className="address">
              <a
                href="https://maps.app.goo.gl/SxdPfUWvuDT3jJPR7"
                target="blank"
              >
                Jai Palace, Lake Kalamba - Gargoti Rd, Kolahpur
              </a>
            </div>
          </div>
          <div className="placeInfo">
            <p>with best compliments from</p>
            <div className="compliments">
              <h1>Tazin & Faisal Patil</h1>
            </div>
          </div>
          <p id="outro">
            Presents accepted in blessings only.
            <br /> Your presence is what matters most to us.
          </p>
        </div>
      </div>
    </>
  );
}
