import { useWhiteLabel } from "@/contexts/WhiteLabelContext";
import { Link } from "react-router-dom";
const WhiteLabelFooter = () => {
  const {
    agencySettings
  } = useWhiteLabel();
  const agencyName = agencySettings?.agency_name || "AI Agency";
  const contactEmail = agencySettings?.contact_email;
  const contactPhone = agencySettings?.contact_phone;
  const hidePoweredBy = agencySettings?.hide_powered_by || false;
  return <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-lg mb-4">{agencyName}</h3>
            <p className="text-muted-foreground mb-4">
              {agencySettings?.about_content || "Empowering businesses with innovative solutions that transform the way you work and grow."}
            </p>
            {contactEmail && <p className="text-sm text-muted-foreground">
                Email: <a href={`mailto:${contactEmail}`} className="hover:text-primary">{contactEmail}</a>
              </p>}
            {contactPhone && <p className="text-sm text-muted-foreground">
                Phone: <a href={`tel:${contactPhone}`} className="hover:text-primary">{contactPhone}</a>
              </p>}
          </div>

          

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-primary">About Us</a></li>
              <li><a href="#contact" className="hover:text-primary">Contact</a></li>
              <li><Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {agencyName}. All rights reserved.
          </p>
          {!hidePoweredBy && <p className="text-xs text-muted-foreground mt-2 md:mt-0">
              Powered by AI Agency Platform
            </p>}
        </div>
      </div>
    </footer>;
};
export default WhiteLabelFooter;