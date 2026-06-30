export function createComponentManager() {
  const definitions = new Map();
  const instances = new Map();

  function register(definition) {
    if (!definition || typeof definition !== "object") {
      throw new Error("Component definition must be an object.");
    }

    if (typeof definition.id !== "string" || !definition.id.trim()) {
      throw new Error("Component definition must include a non-empty id.");
    }

    definitions.set(definition.id, {
      label: definition.label || definition.id,
      create: null,
      ...definition
    });
  }

  function getDefinition(componentId) {
    return definitions.get(componentId) || null;
  }

  function getRegisteredComponentIds() {
    return Array.from(definitions.keys());
  }

  function mount(componentId, context = {}) {
    const definition = getDefinition(componentId);

    if (!definition) {
      throw new Error(`No PBQ component registered for "${componentId}".`);
    }

    const instance = typeof definition.create === "function"
      ? definition.create(context)
      : { ...definition };

    if (typeof instance.initialize === "function") {
      instance.initialize(context);
    }

    instances.set(componentId, instance);
    return instance;
  }

  function mountMany(componentIds = [], context = {}) {
    return componentIds.map(componentId => mount(componentId, context));
  }

  function getInstance(componentId) {
    return instances.get(componentId) || null;
  }

  function renderAll() {
    instances.forEach(instance => {
      if (typeof instance.render === "function") {
        instance.render();
      }
    });
  }

  function sendEvent(eventName, payload) {
    instances.forEach(instance => {
      if (typeof instance.handleEvent === "function") {
        instance.handleEvent(eventName, payload);
      }
    });
  }

  function serialize() {
    return Array.from(instances.entries()).reduce((snapshot, [componentId, instance]) => {
      if (typeof instance.serialize === "function") {
        snapshot[componentId] = instance.serialize();
      }
      return snapshot;
    }, {});
  }

  function unmountAll() {
    instances.forEach(instance => {
      if (typeof instance.unmount === "function") {
        instance.unmount();
      }
    });
    instances.clear();
  }

  return {
    register,
    getDefinition,
    getRegisteredComponentIds,
    mount,
    mountMany,
    getInstance,
    renderAll,
    sendEvent,
    serialize,
    unmountAll
  };
}
