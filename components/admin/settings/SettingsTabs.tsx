"use client";

import { useState } from "react";
import GeneralSettingsForm from "@/components/admin/settings/GeneralSettingsForm";
import ContactSettingsForm from "@/components/admin/settings/ContactSettingsForm";
import HomepageSettingsForm from "@/components/admin/settings/HomepageSettingsForm";
import BrandingSettingsForm from "@/components/admin/settings/BrandingSettingsForm";
import FeatureSettingsForm from "@/components/admin/settings/FeatureSettingsForm";
import { SETTINGS_SECTIONS, type SettingsSection, type SiteSettings } from "@/types/settings";

interface SettingsTabsProps {
  settings: SiteSettings;
}

export default function SettingsTabs({ settings }: SettingsTabsProps) {
  const [active, setActive] = useState<SettingsSection>("general");

  return (
    <div>
      <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b border-[#E8E8E8]">
        {SETTINGS_SECTIONS.map((section) => {
          const isActive = section.key === active;
          return (
            <button
              key={section.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(section.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${
                isActive
                  ? "border-[#C8A928] text-[#111111]"
                  : "border-transparent text-[#666666] hover:text-[#111111]"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-[#E8E8E8] bg-white p-6 sm:p-8">
        {active === "general" && <GeneralSettingsForm settings={settings} />}
        {active === "contact" && <ContactSettingsForm settings={settings} />}
        {active === "homepage" && <HomepageSettingsForm settings={settings} />}
        {active === "branding" && <BrandingSettingsForm settings={settings} />}
        {active === "features" && <FeatureSettingsForm settings={settings} />}
      </div>
    </div>
  );
}
