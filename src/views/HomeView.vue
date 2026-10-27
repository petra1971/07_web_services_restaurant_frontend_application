
<script setup>
import { RouterLink } from 'vue-router'
import restaurantHero from '../assets/images/restaurant-hero.png'
</script>

<template>
  <div class="home-page">
    <section
        class="hero"
        :style="{ backgroundImage: `url(${restaurantHero})` }"
        aria-labelledby="hero-title"
    >
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <p class="hero-eyebrow">
          VÄLKOMMEN TILL SKÄRGÅRDEN
        </p>

        <h1 id="hero-title">
          En plats för god mat,<br />
          fina möten och<br />
          minnesvärda stunder.
        </h1>

        <p class="hero-description">
          Upplev det bästa av skandinavisk matlagning
          i en varm och välkomnande miljö vid
          Göteborgs hamn.
        </p>

        <div class="hero-actions">
          <RouterLink to="/bookings" class="btn btn-primary">
            Boka bord
          </RouterLink>

          <a href="#meny" class="btn btn-secondary">
            Upptäck vår meny
          </a>
        </div>
      </div>
    </section>

    <section id="om-oss" class="intro-section">
      <p class="section-eyebrow">OM SKÄRGÅRDEN</p>

      <h2>Smaker inspirerade av havet</h2>

      <p>
        På SKÄRGÅRDEN möts nordiska råvaror,
        god mat och en avslappnad atmosfär.
        Här finns plats för både vardag och fest.
      </p>
    </section>

    <section id="meny" class="menu-section">
      <p class="section-eyebrow">MAT & DRYCK</p>
      <h2>Upptäck vår meny</h2>

      <p>
        Vår meny presenteras här inom kort.
      </p>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 680px;
  min-height: calc(100svh - 100px);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  color: #fff;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
      90deg,
      rgba(13, 26, 21, 0.78) 0%,
      rgba(13, 26, 21, 0.48) 48%,
      rgba(13, 26, 21, 0.08) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 90px 48px;
}

.hero-eyebrow {
  margin-bottom: 22px;
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  font-weight: 500;
}

.hero h1 {
  max-width: 780px;
  margin: 0 0 28px;
  color: #fff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.7rem, 5vw, 5rem);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.025em;
}

.hero-description {
  max-width: 490px;
  margin-bottom: 34px;
  font-size: 1.08rem;
  line-height: 1.8;
  color: #f8f6f1;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 14px 28px;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s ease;
}

.btn-primary {
  background: #263f35;
  color: #fff;
}

.btn-primary:hover {
  background: #365749;
}

.btn-secondary {
  background: transparent;
  border-color: #fff;
  color: #fff;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.intro-section,
.menu-section {
  padding: 100px 24px;
  text-align: center;
}

.intro-section {
  background: #f8f6f1;
  color: #252c27;
}

.menu-section {
  background: #e9e1d3;
  color: #252c27;
}

.section-eyebrow {
  color: #607766;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
}

.intro-section h2,
.menu-section h2 {
  margin: 18px 0 24px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 400;
}

.intro-section > p:last-child,
.menu-section > p:last-child {
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.8;
}

@media (max-width: 768px) {
  .hero {
    min-height: 650px;
    background-position: 60% center;
  }

  .hero-content {
    padding: 80px 24px;
  }

  .hero-overlay {
    background: linear-gradient(
        90deg,
        rgba(13, 26, 21, 0.82),
        rgba(13, 26, 21, 0.35)
    );
  }

  .hero h1 br {
    display: none;
  }

  .hero-description {
    font-size: 1rem;
  }

  .intro-section,
  .menu-section {
    padding: 70px 24px;
  }
}
</style>
