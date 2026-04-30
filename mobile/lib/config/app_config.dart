class AppConfig {
  const AppConfig({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.deepLinkScheme,
  });

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String deepLinkScheme;

  static AppConfig fromEnvironment() {
    return const AppConfig(
      supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
      supabaseAnonKey: String.fromEnvironment('SUPABASE_ANON_KEY'),
      deepLinkScheme: String.fromEnvironment(
        'MOBILE_DEEP_LINK_SCHEME',
        defaultValue: 'capsulezero',
      ),
    );
  }
}
