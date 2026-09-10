(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileLayout = window.matchMedia("(max-width: 700px), (pointer: coarse)");

  document.documentElement.classList.add("js-ready");

  const intro = qs("#filmIntro");
  const leader = qs("#leaderFrame");
  const countdown = qs("#countdownNumber");
  const openingCard = qs("#openingCard");
  const skipIntro = qs("#skipIntro");
  const startPicture = qs("#startPicture");
  let introReady = false;
  let introTimer = 0;

  const showOpeningCard = () => {
    window.clearInterval(introTimer);
    leader.hidden = true;
    openingCard.hidden = false;
    introReady = true;
    window.setTimeout(() => startPicture.focus({ preventScroll: true }), 60);
  };

  const finishIntro = () => {
    window.clearInterval(introTimer);
    intro.classList.add("is-finished");
    document.body.classList.remove("intro-open");
    window.setTimeout(() => {
      intro.hidden = true;
    }, reducedMotion ? 20 : 1100);
  };

  if (reducedMotion) {
    showOpeningCard();
  } else {
    const numbers = [5, 4, 3, 2, 1];
    let frame = 0;
    countdown.textContent = String(numbers[frame]);
    introTimer = window.setInterval(() => {
      frame += 1;
      if (frame >= numbers.length) {
        showOpeningCard();
        return;
      }
      countdown.textContent = String(numbers[frame]);
      leader.classList.remove("count-pop");
      void leader.offsetWidth;
      leader.classList.add("count-pop");
    }, 620);
  }

  skipIntro.addEventListener("click", finishIntro);
  startPicture.addEventListener("click", finishIntro);
  intro.addEventListener("wheel", (event) => {
    if (introReady && event.deltaY > 0) finishIntro();
  }, { passive: true });

  let introTouchStart = 0;
  intro.addEventListener("touchstart", (event) => {
    introTouchStart = event.changedTouches[0]?.clientY || 0;
  }, { passive: true });
  intro.addEventListener("touchend", (event) => {
    const touchEnd = event.changedTouches[0]?.clientY || 0;
    if (introReady && introTouchStart - touchEnd > 28) finishIntro();
  }, { passive: true });

  const cursor = qs("#customCursor");
  const cursorLabel = qs("#cursorLabel");
  let cursorX = 0;
  let cursorY = 0;
  let cursorFrame = 0;

  const paintCursor = () => {
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    cursorFrame = 0;
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    cursorX = event.clientX;
    cursorY = event.clientY;
    cursor.classList.add("visible");
    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(paintCursor);
  });

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-cursor], button, a");
    cursorLabel.textContent = target?.dataset.cursor || (target ? "OPEN" : "LOOK");
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("active"));
  document.addEventListener("pointerup", () => cursor.classList.remove("active"));
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("visible"));

  let audioContext = null;
  let ambience = null;
  let soundEnabled = false;
  const soundToggle = qs("#soundToggle");
  const soundLabel = qs("#soundLabel");

  const createAudioContext = () => {
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioContext = new AudioCtor();
    }
    return audioContext;
  };

  const startAmbience = () => {
    const context = createAudioContext();
    if (!context || ambience) return;

    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (index % 173 < 3 ? .85 : .12);
    }

    const noise = context.createBufferSource();
    const noiseGain = context.createGain();
    const filter = context.createBiquadFilter();
    const hum = context.createOscillator();
    const humGain = context.createGain();

    noise.buffer = buffer;
    noise.loop = true;
    noiseGain.gain.value = .035;
    filter.type = "lowpass";
    filter.frequency.value = 1650;
    hum.type = "sine";
    hum.frequency.value = 52;
    humGain.gain.value = .009;

    noise.connect(filter).connect(noiseGain).connect(context.destination);
    hum.connect(humGain).connect(context.destination);
    noise.start();
    hum.start();
    ambience = { noise, hum };
  };

  const stopAmbience = () => {
    if (!ambience) return;
    ambience.noise.stop();
    ambience.hum.stop();
    ambience = null;
  };

  const playBlip = (frequency = 420, duration = .08, volume = .04) => {
    if (!soundEnabled) return;
    const context = createAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  soundToggle.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    soundLabel.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";
    if (soundEnabled) {
      const context = createAudioContext();
      if (context?.state === "suspended") await context.resume();
      startAmbience();
      playBlip(510, .09, .025);
    } else {
      stopAmbience();
    }
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-in");
    });
  }, { threshold: .16 });

  qsa(".reveal").forEach((element) => revealObserver.observe(element));

  const hero = qs("#hero");
  const filmstripWindow = qs("#filmstripWindow");
  const filmstripTrack = qs("#filmstripTrack");
  const creditsSection = qs("#credits");
  const creditsRoll = qs("#creditsRoll");
  let scrollTicking = false;

  const updateScrollScenes = () => {
    const viewportHeight = window.innerHeight;

    if (!reducedMotion) {
      const heroRect = hero.getBoundingClientRect();
      const heroProgress = clamp(-heroRect.top / Math.max(1, heroRect.height - viewportHeight));
      hero.style.setProperty("--hero-progress", heroProgress.toFixed(3));

      if (!mobileLayout.matches) {
        const stripRect = filmstripWindow.getBoundingClientRect();
        const stripProgress = clamp((viewportHeight - stripRect.top) / (viewportHeight + stripRect.height));
        const stripRange = Math.max(0, filmstripTrack.scrollWidth - window.innerWidth + window.innerWidth * .1);
        filmstripTrack.style.transform = `translate3d(${-stripRange * stripProgress}px, -50%, 0)`;
      }

      const creditsRect = creditsSection.getBoundingClientRect();
      const creditsDistance = Math.max(1, creditsSection.offsetHeight - viewportHeight);
      const creditsProgress = clamp(-creditsRect.top / creditsDistance);
      const creditsStart = viewportHeight * .92;
      const creditsEnd = -(creditsRoll.offsetHeight + viewportHeight * .08);
      const creditsY = creditsStart + (creditsEnd - creditsStart) * creditsProgress;
      creditsRoll.style.transform = `translate3d(-50%, ${creditsY}px, 0)`;
    }

    scrollTicking = false;
  };

  const requestScrollPaint = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollScenes);
    }
  };

  window.addEventListener("scroll", requestScrollPaint, { passive: true });
  window.addEventListener("resize", requestScrollPaint);
  window.visualViewport?.addEventListener("resize", requestScrollPaint);
  updateScrollScenes();

  const channels = [
    { image: "rupinder-02.webp", label: "GOOD VIBES", alt: "Rupinder seated in a colourful retro outfit" },
    { image: "rupinder-07.webp", label: "GEDI MODE", alt: "Rupinder beside a vintage car in a teal jacket" },
    { image: "rupinder-03.webp", label: "BIRTHDAY CHAOS", alt: "Rupinder smiling in a pink blouse" },
    { image: "rupinder-08.webp", label: "TEAM MESSAGES", alt: "Rupinder smiling in a denim jacket" },
    { image: "rupinder-01.webp", label: "RUPINDER ARCHIVES", alt: "Rupinder seated in a red Punjabi suit" }
  ];

  const tvScreen = qs("#tvScreen");
  const tvImage = qs("#tvImage");
  const tvChannelNumber = qs("#tvChannelNumber");
  const tvChannelLabel = qs("#tvChannelLabel");

  qsa(".channel-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.channel);
      const channel = channels[index];
      qsa(".channel-button").forEach((item) => item.classList.toggle("active", item === button));
      tvScreen.classList.add("channel-switch");
      playBlip(180 + index * 70, .12);
      window.setTimeout(() => {
        tvImage.src = `./assets/images/${channel.image}`;
        tvImage.alt = channel.alt;
        tvChannelNumber.textContent = `CH ${String(index + 1).padStart(2, "0")}`;
        tvChannelLabel.textContent = channel.label;
        tvScreen.classList.remove("channel-switch");
      }, reducedMotion ? 0 : 170);
    });
  });

  const greetings = Array.isArray(window.RUPINDER_GREETINGS) ? window.RUPINDER_GREETINGS : [];
  const messageGrid = qs("#messageGrid");
  const messageDialog = qs("#messageDialog");
  const messageFrom = qs("#messageFrom");
  const messageStamp = qs("#messageStamp");
  const messageBody = qs("#messageBody");
  const messageNumber = qs("#messageNumber");
  let activeMessage = 0;

  const renderMessageCards = () => {
    const fragment = document.createDocumentFragment();
    greetings.forEach((greeting, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "message-card";
      button.dataset.cursor = "OPEN 💌";
      button.setAttribute("aria-label", `Open birthday message from ${greeting.name}`);

      const number = document.createElement("span");
      number.className = "card-number";
      number.textContent = `MSG ${String(index + 1).padStart(2, "0")}`;

      const name = document.createElement("strong");
      name.textContent = greeting.name;

      const stamp = document.createElement("small");
      stamp.textContent = greeting.stamp;

      button.append(number, name, stamp);
      button.addEventListener("click", () => openMessage(index));
      fragment.append(button);
    });
    messageGrid.append(fragment);
  };

  const populateMessage = (index) => {
    activeMessage = (index + greetings.length) % greetings.length;
    const greeting = greetings[activeMessage];
    messageFrom.textContent = `FROM ${greeting.name}`;
    messageStamp.textContent = greeting.stamp;
    messageBody.textContent = greeting.message;
    messageNumber.textContent = `${String(activeMessage + 1).padStart(2, "0")}/${String(greetings.length).padStart(2, "0")}`;
    messageBody.lang = /[\u0A00-\u0A7F]/.test(greeting.message) ? "pa" : "en";
    playBlip(360 + activeMessage * 8, .055, .025);
  };

  const openMessage = (index) => {
    populateMessage(index);
    if (typeof messageDialog.showModal === "function") {
      messageDialog.showModal();
    } else {
      messageDialog.setAttribute("open", "");
    }
  };

  renderMessageCards();

  qs("#modalClose").addEventListener("click", () => messageDialog.close());
  qs("#previousMessage").addEventListener("click", () => populateMessage(activeMessage - 1));
  qs("#nextMessage").addEventListener("click", () => populateMessage(activeMessage + 1));
  qs("#allMessages").addEventListener("click", () => {
    messageDialog.close();
    qs("#messagesTitle").focus?.({ preventScroll: true });
  });

  messageDialog.addEventListener("click", (event) => {
    if (event.target === messageDialog) messageDialog.close();
  });

  const toast = qs("#birthdayToast");
  const confettiField = qs("#confettiField");
  const cameraFlash = qs("#cameraFlash");
  let toastTimer = 0;

  const showToast = (message, delay = 2800) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), delay);
  };

  const burstConfetti = (count = 65) => {
    const colors = ["#dda829", "#b52d22", "#2f7774", "#f3e1bd", "#c85d75", "#d96c2e"];
    const amount = reducedMotion ? Math.min(count, 18) : count;
    for (let index = 0; index < amount; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--drift", `${(Math.random() - .5) * 42}vw`);
      piece.style.setProperty("--spin", `${(Math.random() > .5 ? 1 : -1) * (420 + Math.random() * 760)}deg`);
      piece.style.setProperty("--fall-time", `${2.3 + Math.random() * 2.4}s`);
      piece.style.animationDelay = `${Math.random() * .35}s`;
      piece.style.borderRadius = index % 4 === 0 ? "50%" : "0";
      confettiField.append(piece);
      window.setTimeout(() => piece.remove(), reducedMotion ? 120 : 5200);
    }
  };

  const flashCamera = () => {
    cameraFlash.classList.remove("flash");
    void cameraFlash.offsetWidth;
    cameraFlash.classList.add("flash");
    playBlip(900, .04, .06);
  };

  const easterMessages = {
    ticket: "ADMIT ONE: Rupinder's Birthday. Seat reserved. Good vibes compulsory. 🎟️",
    photo: "Archive officially stamped: main character energy. ✨"
  };

  qsa("[data-easter]").forEach((object) => {
    object.addEventListener("click", () => {
      const type = object.dataset.easter;
      showToast(easterMessages[type] || "Birthday surprise unlocked. ✨");
      if (type === "photo") flashCamera();
      if (type === "ticket") burstConfetti(24);
    });
  });

  const wishButton = qs("#makeWishButton");
  const wishExperience = qs("#wishExperience");
  const wishClose = qs("#wishClose");
  const candles = qsa(".candle", qs("#candles"));
  const candleInstruction = qs("#candleInstruction");
  const wishResult = qs("#wishResult");
  const cinemaEnding = qs("#cinemaEnding");
  let wishCompleted = false;

  const openWish = () => {
    candles.forEach((candle) => candle.classList.remove("out"));
    candleInstruction.hidden = false;
    wishResult.hidden = true;
    wishCompleted = false;
    wishExperience.classList.add("open");
    wishExperience.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => candles[0].focus(), 80);
  };

  const closeWish = () => {
    wishExperience.classList.remove("open");
    wishExperience.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (!wishCompleted) wishButton.focus({ preventScroll: true });
  };

  const completeWish = () => {
    if (wishCompleted) return;
    wishCompleted = true;
    candleInstruction.hidden = true;
    wishResult.hidden = false;
    burstConfetti(150);
    [520, 660, 820, 1040].forEach((note, index) => {
      window.setTimeout(() => playBlip(note, .2, .035), index * 130);
    });
    window.setTimeout(() => {
      closeWish();
      cinemaEnding.classList.add("revealed");
      window.setTimeout(() => cinemaEnding.classList.add("second-line"), 1450);
    }, reducedMotion ? 100 : 3200);
  };

  wishButton.addEventListener("click", openWish);
  wishClose.addEventListener("click", closeWish);
  candles.forEach((candle) => {
    candle.addEventListener("click", () => {
      if (candle.classList.contains("out")) return;
      candle.classList.add("out");
      playBlip(250, .06, .025);
      if (candles.every((item) => item.classList.contains("out"))) completeWish();
    });
  });

  wishExperience.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWish();
  });

  const signature = qs("#signatureSpark");
  signature.addEventListener("click", () => {
    signature.classList.remove("sparked");
    void signature.offsetWidth;
    signature.classList.add("sparked");
    flashCamera();
    burstConfetti(22);
    showToast("Made with an unreasonable amount of pyaar. ❤️", 2200);
  });
})();
