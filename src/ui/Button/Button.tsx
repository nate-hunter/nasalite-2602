import React from 'react';

import { LoadingIcon } from '@/ui/Icon';

import './button.css';

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
	/** Visual style: primary (main CTA), secondary (outline), ghost (transparent), danger (destructive). */
	variant?: ButtonVariant;
	/** When true, applies disabled styles and sets the disabled attribute. */
	disabled?: boolean;
	/** When true, shows a spinner, sets aria-busy, and disables interaction until cleared. */
	loading?: boolean;
	/** Visible label while loading; defaults to children when omitted. */
	loadingLabel?: React.ReactNode;
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
	loading = false,
	loadingLabel,
	className,
	'aria-busy': ariaBusy,
	...props
}: ButtonProps) {
	const isDisabled = disabled || loading;
	const variantClass = variant;

	return (
		<button
			type="button"
			className={['nl-btn', variantClass, isDisabled ? 'disabled' : undefined, loading ? 'loading' : undefined, className]
				.filter(Boolean)
				.join(' ')}
			disabled={isDisabled}
			aria-busy={loading ? true : ariaBusy}
			{...props}
		>
			{loading ? (
				<>
					<LoadingIcon size={16} className="nl-btn-spinner" aria-hidden />
					<span className="nl-btn-label">{loadingLabel ?? children}</span>
				</>
			) : (
				children
			)}
		</button>
	);
}

export default Button;
