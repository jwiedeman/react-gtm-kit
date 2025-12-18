// Mock Nuxt imports for testing

export const defineNuxtPlugin = (fn: (nuxtApp: unknown) => unknown) => fn;

export const useRoute = () => ({
  fullPath: '/test-path',
  path: '/test-path',
  query: {}
});

export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn()
});

export const navigateTo = jest.fn();

export const useNuxtApp = () => ({
  vueApp: {
    use: jest.fn()
  }
});
