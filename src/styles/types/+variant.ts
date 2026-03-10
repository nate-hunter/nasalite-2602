export type SemanticVariant =
  | 'default'
  | 'cta'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral';

export type AppVariant = 'sunset' | 'buttery' | 'sage' | 'midnight';

export type Variant = SemanticVariant | AppVariant;

export type VariantBG = 'default' | 'transparent' | 'inverted';

export type VariantSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type VariantMode =
  | 'onDark'
  | 'onDarkAlt'
  | 'onLight'
  | 'onLightAlt'
  | 'on-default'
  | 'on-alt';

export type VariantShape = 'sharp' | 'straight' | 'curved' | 'rounded' | 'pill';

export type VariantState =
  | 'default'
  | 'idle'
  | 'loading'
  | 'active'
  | 'disabled'
  | 'hover'
  | 'focus'
  | 'downloading';
