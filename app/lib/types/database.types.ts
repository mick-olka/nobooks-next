export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	public: {
		Tables: {
			wiki_pages: {
				Row: {
					id: string;
					title: string;
					content: string;
					url_name: string;
					created_at: string;
					updated_at: string;
					created_by: string;
					last_modified_by: string;
					type: string;
				};
				Insert: {
					id?: string;
					title: string;
					content: string;
					url_name: string;
					type: string;
					created_by?: string;
					last_modified_by?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					title?: string;
					content?: string;
					url_name?: string;
					type?: string;
					last_modified_by?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: {
			get_user_role: {
				Args: Record<string, never>;
				Returns: string;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
