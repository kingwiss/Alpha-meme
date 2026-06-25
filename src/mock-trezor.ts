// Resilient mock for hardware wallet dependencies
const mock: any = new Proxy(() => mock, {
  get: (target, prop) => {
    if (prop === '__esModule') return true;
    return mock;
  },
  apply: () => mock,
  construct: () => mock
});

export default mock;
export const TrezorConnect = mock;
