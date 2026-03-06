import gql from "graphql-tag";

export const twitchSidebarCardQuery = gql`
	query SidebarCardTitle($login: String!) {
		user(login: $login) {
			id
			stream {
				id
				title
			}
			lastBroadcast {
				id
				title
			}
		}
	}
`;

export namespace twitchSidebarCardQuery {
	export interface Variables {
		login: string;
	}

	export interface Response {
		user: {
			id: string;
			stream: {
				id: string;
				title: string | null;
			} | null;
			lastBroadcast: {
				id: string;
				title: string | null;
			} | null;
		} | null;
	}
}
