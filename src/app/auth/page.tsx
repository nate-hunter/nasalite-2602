import { UserRegisterForm } from './user-register-form';
import { UserLoginForm } from './user-login-form';

// ~~~ [DEV] TEST COMPONENTS ~~~
import { TestUserValues } from './test-elements';

export default function AuthPage() {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				rowGap: '0.75rem',
			}}
		>
			<h1>User Auth</h1>

			{<TestUserValues />}

			<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem' }}>
				<FormWrapper>
					<h2>Register</h2>
					<UserRegisterForm />
				</FormWrapper>

				<FormWrapper>
					<h2>Login</h2>
					<UserLoginForm />
				</FormWrapper>
			</div>

			{/* <FormWrapper style={{ display: 'flex', justifyContent: 'space-between' }}>
				<button>Register with password</button>
				<button>Login</button>
				<button>Magic Link</button>
			</FormWrapper> */}
		</div>
	);
}

type FormWrapperProps = React.ComponentPropsWithoutRef<'div'> & {
	children: React.ReactNode;
};
function FormWrapper({ children, ...props }: FormWrapperProps) {
	const { style } = props;
	return (
		<div style={{ border: '1px solid grey', padding: '1rem', width: '100%', ...style }}>
			{children}
		</div>
	);
}
