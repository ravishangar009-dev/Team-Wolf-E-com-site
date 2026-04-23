import { useSiteSettings } from "@/hooks/useSiteSettings";
import SiteLockdown from "@/components/SiteLockdown";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const { settings } = useSiteSettings();

  if (settings && !settings.is_site_active) {
    return (
      <SiteLockdown
        reopenAt={settings.reopen_at}
        message={settings.shutdown_message}
      />
    );
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
