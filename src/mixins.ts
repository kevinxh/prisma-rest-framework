type Constructor = new (...args: any[]) => {};

function listMixin<TBase extends Constructor>(Base: TBase) {
  return class ListMixin extends Base {
    list() {
      return [1, 2, 3];
    }
  };
}

export { listMixin };
