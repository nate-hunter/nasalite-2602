function MailpitDevLink() {
	return (
		<a
			href="http://127.0.0.1:54324"
			target="_blank"
			rel="noopener noreferrer"
			style={mailpitLinkStyles}
		>
			Open Mailpit (local dev)
		</a>
	);
}

export default MailpitDevLink;

const mailpitLinkStyles: React.CSSProperties = {
	display: 'inline-block',
	marginTop: 'var(--sp-4)',
	fontFamily: 'var(--font-gothic), ui-sans-serif, system-ui, sans-serif',
	fontSize: 'var(--font-caption)',
	fontWeight: 'var(--weight-normal)',
	color: 'var(--color-font-muted)',
	textDecoration: 'underline',
	textUnderlineOffset: '2px',
};

// TODO? Add hover styles?
