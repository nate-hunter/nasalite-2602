import React from 'react';

import './button.css';

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
	/** Visual style: primary (main CTA), secondary (outline), ghost (transparent), danger (destructive). */
	variant?: ButtonVariant;
	/** When true, applies disabled styles and sets the disabled attribute. */
	disabled?: boolean;
};

/**
 * Reusable button component — design system §6.
 * Use variant="primary" for main CTAs, "secondary" for outline actions,
 * "ghost" for tertiary actions, "danger" for destructive actions.
 */
export function Button({
	children,
	variant = 'secondary',
	disabled = false,
	className,
	...props
}: ButtonProps) {
	const variantClass = variant;
	const disabledClass = disabled ? 'disabled' : undefined;

	return (
		<button
			type="button"
			className={['nl-btn', variantClass, disabledClass, className].filter(Boolean).join(' ')}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}

export default Button;
