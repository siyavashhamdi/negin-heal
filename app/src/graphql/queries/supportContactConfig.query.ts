import { gql } from "@apollo/client";

export const SUPPORT_CONTACT_QUERY = gql`
  query SupportContactConfig {
    supportContactConfig {
      eyebrow
      heading
      subtitle
      availabilityLabel
      responseTimeLabel
      faqTitle
      faqDescription
      contactSectionEyebrow
      contactSectionHeading
      contactSectionSubtitle
      tipsEyebrow
      tipsHeading
      channels {
        type
        label
        value
        href
        description
        isActive
        isPrimary
      }
      quickTips
      faqPage {
        eyebrow
        heading
        subtitle
        searchLabel
        searchPlaceholder
        resultCountLabel
        noResultsLabel
        emptyTitle
        emptyDescription
        emptyActionLabel
        sections {
          id
          title
          description
          items {
            id
            question
            answer
          }
        }
      }
    }
  }
`;
