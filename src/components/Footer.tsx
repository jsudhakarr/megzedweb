import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

interface FooterProps {
  settings: {
    appname?: string;
    logo?: {
      thumbnail: string;
    };
    primary_color?: string;
    currency?: string;
    language?: string;
    contact_email?: string;
    contact_phone?: string;
  };
  primaryColor: string;
}

export default function Footer({ settings, primaryColor }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo?.thumbnail ? (
                <img
                  src={settings.logo.thumbnail}
                  alt={settings.appname}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <Store className="w-6 h-6" style={{ color: primaryColor }} />
              )}
              <span className="text-lg font-bold text-white">
                {settings?.appname?.split(' - ')[0] || 'Megzed'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Your trusted marketplace for buying and selling. Find great deals and list your items today.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/pages/about" className="text-sm hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pages/contact" className="text-sm hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/pages/terms" className="text-sm hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/pages/privacy" className="text-sm hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/refund" className="text-sm hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/pages/safety" className="text-sm hover:text-white transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/pages/faq" className="text-sm hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <a
                  href={`mailto:${settings?.contact_email || 'support@megzed.com'}`}
                  className="text-sm hover:text-white transition-colors break-all"
                >
                  {settings?.contact_email || 'support@megzed.com'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <a
                  href={`tel:${settings?.contact_phone || '+1234567890'}`}
                  className="text-sm hover:text-white transition-colors"
                >
                  {settings?.contact_phone || '+1 (234) 567-890'}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                <span className="text-sm">
                  {settings?.currency || 'USD'} | {settings?.language?.toUpperCase() || 'EN'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-sm text-slate-400">
            {currentYear} {settings?.appname?.split(' - ')[0] || 'Megzed'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
