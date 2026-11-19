type PersonDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
};

export function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Fyll i telefonnummer.";
  if (!/^0[1-9]\d{6,8}$/.test(digits)) {
    return "Ange ett giltigt telefonnummer, till exempel 070-123 45 67.";
  }
  return "";
}

export function validatePersonDetails(details: PersonDetails) {
  if (!details.firstName.trim()) return "Fyll i förnamn.";
  if (!details.lastName.trim()) return "Fyll i efternamn.";
  const phoneError = validatePhone(details.phone);
  if (phoneError) return phoneError;
  if (!details.street.trim()) return "Fyll i gatuadress.";
  if (!details.postalCode.trim()) return "Fyll i postnummer.";
  if (!/^[1-9]\d{4}$/.test(details.postalCode.replace(/\s/g, ""))) {
    return "Postnumret ska innehålla fem siffror.";
  }
  if (!details.city.trim()) return "Fyll i ort.";
  return "";
}

export function validateEmergencyContact(details: {
  firstName: string;
  lastName: string;
  phone: string;
  relation: string;
  otherRelation: string;
}) {
  if (!details.firstName.trim()) return "Fyll i nödkontaktens förnamn.";
  if (!details.lastName.trim()) return "Fyll i nödkontaktens efternamn.";
  if (!details.relation) return "Välj din relation till nödkontakten.";
  if (details.relation === "Annat" && !details.otherRelation.trim()) {
    return "Beskriv relationen till nödkontakten.";
  }
  return validatePhone(details.phone);
}
