<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGtmPush } from '@jwiedeman/gtm-kit-vue';

const push = useGtmPush();

// Data layer inspector
const dataLayerEntries = ref<{ index: number; data: string; timestamp: string }[]>([]);
const isInspectorOpen = ref(false);

// Get data layer reference
const getDataLayer = () => {
  const win = window as unknown as { vueAppDataLayer?: unknown[] };
  return win.vueAppDataLayer || [];
};

// Update inspector
const updateInspector = () => {
  const layer = getDataLayer();
  dataLayerEntries.value = layer.map((entry, index) => ({
    index,
    data: JSON.stringify(entry, null, 2),
    timestamp: new Date().toLocaleTimeString()
  }));
};

let intervalId: number;

onMounted(() => {
  updateInspector();
  intervalId = window.setInterval(updateInspector, 500);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

// Custom event tracking examples
const trackCTAClick = () => {
  push({
    event: 'cta_click',
    cta_name: 'hero_get_started',
    cta_location: 'homepage_hero'
  });
};

const trackVideoPlay = () => {
  push({
    event: 'video_start',
    video_title: 'GTM Kit Introduction',
    video_provider: 'youtube',
    video_url: 'https://youtube.com/example'
  });
};

const trackFileDownload = () => {
  push({
    event: 'file_download',
    file_name: 'gtm-kit-guide.pdf',
    file_extension: 'pdf',
    link_url: '/downloads/gtm-kit-guide.pdf'
  });
};

const trackFormSubmit = () => {
  push({
    event: 'generate_lead',
    form_id: 'newsletter_signup',
    form_name: 'Newsletter Subscription',
    value: 10,
    currency: 'USD'
  });
};

const trackSearch = () => {
  push({
    event: 'search',
    search_term: 'gtm integration'
  });
};

const trackShare = () => {
  push({
    event: 'share',
    method: 'twitter',
    content_type: 'article',
    item_id: 'gtm-kit-docs'
  });
};

const trackLogin = () => {
  push({
    event: 'login',
    method: 'email'
  });
};

const trackSignUp = () => {
  push({
    event: 'sign_up',
    method: 'google'
  });
};

const trackException = () => {
  push({
    event: 'exception',
    description: 'Demo error for testing',
    fatal: false
  });
};

const trackTiming = () => {
  push({
    event: 'timing_complete',
    name: 'api_response',
    value: 234,
    event_category: 'API',
    event_label: 'users_endpoint'
  });
};
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>Welcome to GTM Kit</h1>
      <p>The simplest way to add Google Tag Manager to your Vue app.</p>
      <button class="cta-button" @click="trackCTAClick">
        Get Started
      </button>
    </section>

    <section class="features">
      <h2>Features</h2>
      <div class="feature-grid">
        <div class="feature-card">
          <h3>Zero Dependencies</h3>
          <p>Core package is only 3.7KB gzipped with no runtime dependencies.</p>
        </div>
        <div class="feature-card">
          <h3>Consent Mode v2</h3>
          <p>Built-in support for Google's Consent Mode with ready-to-use presets.</p>
        </div>
        <div class="feature-card">
          <h3>TypeScript First</h3>
          <p>Full TypeScript support with complete type definitions.</p>
        </div>
        <div class="feature-card">
          <h3>Vue 3 Ready</h3>
          <p>Native Vue 3 composables and plugin for seamless integration.</p>
        </div>
      </div>
    </section>

    <section class="custom-events">
      <h2>Custom Event Examples</h2>
      <p class="section-description">
        Click any button to push the corresponding event to the dataLayer.
        Open the Data Layer Inspector to see events in real-time.
      </p>

      <div class="events-grid">
        <div class="event-group">
          <h3>Engagement Events</h3>
          <div class="button-group">
            <button @click="trackVideoPlay">
              <span class="icon">▶</span> Video Start
            </button>
            <button @click="trackFileDownload">
              <span class="icon">↓</span> File Download
            </button>
            <button @click="trackSearch">
              <span class="icon">🔍</span> Search
            </button>
            <button @click="trackShare">
              <span class="icon">↗</span> Share
            </button>
          </div>
        </div>

        <div class="event-group">
          <h3>Conversion Events</h3>
          <div class="button-group">
            <button @click="trackFormSubmit">
              <span class="icon">📧</span> Generate Lead
            </button>
            <button @click="trackLogin">
              <span class="icon">🔑</span> Login
            </button>
            <button @click="trackSignUp">
              <span class="icon">✨</span> Sign Up
            </button>
          </div>
        </div>

        <div class="event-group">
          <h3>Debug Events</h3>
          <div class="button-group">
            <button @click="trackException">
              <span class="icon">⚠</span> Exception
            </button>
            <button @click="trackTiming">
              <span class="icon">⏱</span> Timing
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Layer Inspector Toggle -->
    <button class="inspector-toggle" @click="isInspectorOpen = !isInspectorOpen">
      {{ isInspectorOpen ? 'Hide' : 'Show' }} Data Layer Inspector
      <span class="badge">{{ dataLayerEntries.length }}</span>
    </button>

    <!-- Data Layer Inspector Panel -->
    <section v-if="isInspectorOpen" class="data-layer-inspector">
      <h2>Data Layer Inspector</h2>
      <p class="inspector-info">
        Live view of all entries in <code>window.vueAppDataLayer</code>.
        Updates automatically as events are pushed.
      </p>

      <div class="entries-list">
        <div
          v-for="entry in dataLayerEntries"
          :key="entry.index"
          class="entry"
        >
          <div class="entry-header">
            <span class="entry-index">#{{ entry.index }}</span>
          </div>
          <pre class="entry-data">{{ entry.data }}</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding: 2rem 0;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-button {
  background: white;
  color: #667eea;
  font-size: 1.125rem;
  padding: 0.75rem 2rem;
  font-weight: 600;
}

.features {
  padding: 2rem 0;
}

.features h2,
.custom-events h2 {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.section-description {
  text-align: center;
  color: #6c757d;
  margin-bottom: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.feature-card h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6c757d;
  margin: 0;
}

/* Custom Events Section */
.custom-events {
  padding: 2rem 0;
  margin-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.event-group {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.event-group h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #2c3e50;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.button-group button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.button-group button:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.button-group .icon {
  font-size: 1rem;
}

/* Inspector Toggle */
.inspector-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  margin-top: 2rem;
  padding: 1rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.inspector-toggle:hover {
  background: #34495e;
}

.badge {
  background: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

/* Data Layer Inspector */
.data-layer-inspector {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #1a1a2e;
  border-radius: 8px;
  color: #e9ecef;
}

.data-layer-inspector h2 {
  color: white;
  margin: 0 0 0.5rem;
  text-align: left;
  font-size: 1.25rem;
}

.inspector-info {
  color: #adb5bd;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.inspector-info code {
  background: #2c3e50;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.entries-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry {
  background: #16213e;
  border-radius: 6px;
  overflow: hidden;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #0f3460;
}

.entry-index {
  font-weight: 600;
  color: #667eea;
}

.entry-data {
  padding: 1rem;
  margin: 0;
  font-size: 0.75rem;
  font-family: 'Monaco', 'Menlo', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: #e9ecef;
  line-height: 1.5;
}
</style>
