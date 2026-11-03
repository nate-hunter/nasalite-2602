import React from 'react';

export default function page() {
	return (
		<div>
			<h1>User Profile...</h1>

			<UserProfileDetails />
		</div>
	);
}

const _dis_up_dts = new Set(); // user profile details to display

const ___exp_details_to_display = [
	{
		// ...field data, e.g.,
	},
];

function UserProfileDetails() {
	return (
		<div>
			<UserProfileField {..._upf} />
		</div>
	);
}

const _upf: _UserProfileField = {
	email: 'local.dev@example.com',
	username: 'local_dev',
	full_name: '',
};

type _UserProfileField = Pick<_UserProfileDBD, 'full_name' | 'username' | 'email'>;
function UserProfileField({ full_name, username, email }: _UserProfileField) {
	const _td = {
		field: '$field', // use `key` instead?
		title: '$title', // not from db
		value: '$value',
	};

	console.log(_up_fake_db);

	const __lab = _up_fake_db;

	return (
		<p>
			<label>{_td['title']}</label>
			<span>{_td['value']}</span>
		</p>
	);
}

type _UserProfileDBD = {
	id: string; // uuid
	full_name: string;
	username: string;
	avatar_url: string;
	updated_at: string; // timestamp
	app_role: string;
	email: string;
};

////////////////////////////////////////////////////////////////////////////////////
// FAKE DEV  DATA //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
const _user_id_fake = '1726';

const _data_fake_up: _UserProfileDBD = {
	id: _user_id_fake,
	full_name: '$fake fullname',
	username: 'local_dev',
	email: 'local.dev@example.com',
	avatar_url: '$/fake/avatar_url',
	updated_at: '2026-06-07',
	app_role: '$fake_app_role',
};
type _FakeDBResult = {
	[id: string]: {
		data: _UserProfileDBD;
	};
};

const _up_fake_db: _FakeDBResult = {
	[_user_id_fake]: {
		data: _data_fake_up,
	},
};
