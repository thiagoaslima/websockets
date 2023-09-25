/**
 * Determines whether or not an object has a given property.
 */
export function hasProperty(
  item: Record<PropertyKey, unknown>,
  property: PropertyKey
): property is keyof typeof item;
export function hasProperty<TItem, TPropName extends PropertyKey>(
  item: TItem,
  property: TPropName
): item is TItem & Record<TPropName, unknown>;
/**
 * **Careful**: Defining a PropValue without passing a type guard makes a type assertion,
 * which overrides the compiler readings and may cause bugs down the future.
 * Use it only if you understand the implications of it.
 */
export function hasProperty<TItem, TPropName extends PropertyKey, TPropValue>(
  item: TItem,
  property: TPropName
): item is TItem & Record<TPropName, TPropValue>;
export function hasProperty<TItem, TPropName extends PropertyKey, TPropValue>(
  item: TItem,
  property: TPropName,
  typeGuard: (value: unknown) => value is TPropValue
): item is TItem & Record<TPropName, TPropValue>;

export function hasProperty<TItem, TPropName extends PropertyKey, TPropValue>(
  item: TItem,
  property: TPropName,
  typeGuard?: (value: unknown) => value is TPropValue
): item is TItem & Record<TPropName, TPropValue> {
  if (isNil(item)) return false;

  try {
    const _item = item as Record<string, unknown>;
    if (property in _item) {
      return typeGuard
        ? typeGuard(_item[property as keyof typeof _item])
        : true;
    }
    return false;
  } catch {
    return false;
  }
}
