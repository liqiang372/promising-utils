export const isNumber = (val: any): val is number => {
  return typeof val === "number";
};

export const isUndefinedOrNull = (val: any): val is undefined | null => {
  return val === undefined || val === null;
};

export const isFunction = (val: any) => {
  return typeof val === "function";
};
