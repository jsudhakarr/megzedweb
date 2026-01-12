type AppLoaderProps = {
  label?: string;
};

export default function AppLoader({ label = 'Loading...' }: AppLoaderProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
