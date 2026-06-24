import type { ReactElement } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import type {
  JsonFormState,
  SupportContactForm,
  SupportFaqItemForm,
  SupportFaqSectionForm,
  UpdateJsonFormState,
} from "./types";
import {
  COMMON_TEXTAREA_ROWS,
  MULTILINE_TEXTAREA_MIN_ROWS,
  MULTILINE_TEXTAREA_MAX_ROWS,
  removeAt,
  replaceAt,
  type TextFieldConfig,
} from "./shared";
import SectionPaper from "./SectionPaper";
import { createEmptyFaqItem, createEmptyFaqSection, createEmptyQuickTip } from "./utils";

const supportMainFields: readonly TextFieldConfig<keyof SupportContactForm>[] = [
  { key: "eyebrow", label: "روتیتر صفحه پشتیبانی" },
  { key: "heading", label: "تیتر صفحه پشتیبانی" },
  { key: "subtitle", label: "زیرتیتر صفحه پشتیبانی", multiline: true },
  { key: "availabilityLabel", label: "متن ساعات پاسخ‌گویی" },
  { key: "responseTimeLabel", label: "متن زمان پاسخ‌گویی" },
  { key: "faqTitle", label: "عنوان سوالات پرتکرار" },
  { key: "faqDescription", label: "توضیح سوالات پرتکرار", multiline: true },
  { key: "ticketTitle", label: "عنوان کارت تیکت" },
  { key: "ticketDescription", label: "توضیح کارت تیکت", multiline: true },
  { key: "contactSectionEyebrow", label: "روتیتر راه‌های ارتباطی" },
  { key: "contactSectionHeading", label: "تیتر راه‌های ارتباطی" },
  { key: "contactSectionSubtitle", label: "زیرتیتر راه‌های ارتباطی", multiline: true },
  { key: "tipsEyebrow", label: "روتیتر نکات سریع" },
  { key: "tipsHeading", label: "تیتر نکات سریع" },
];

const supportChannelFields: readonly TextFieldConfig<keyof SupportContactForm>[] = [
  { key: "whatsapp", label: "واتساپ", type: "url" },
  { key: "telegram", label: "تلگرام", type: "url" },
  { key: "instagram", label: "اینستاگرام", type: "url" },
  { key: "email", label: "ایمیل", type: "email" },
  { key: "phone", label: "تلفن" },
];

const faqPageFields: readonly TextFieldConfig<keyof SupportContactForm["faqPage"]>[] = [
  { key: "eyebrow", label: "روتیتر FAQ" },
  { key: "heading", label: "تیتر FAQ" },
  { key: "subtitle", label: "زیرتیتر FAQ", multiline: true },
  { key: "searchLabel", label: "برچسب جستجو" },
  { key: "searchPlaceholder", label: "متن نمونه جستجو" },
  { key: "resultCountLabel", label: "متن تعداد نتایج" },
  { key: "noResultsLabel", label: "متن بدون نتیجه" },
  { key: "emptyTitle", label: "عنوان حالت خالی" },
  { key: "emptyDescription", label: "توضیح حالت خالی", multiline: true },
  { key: "emptyActionLabel", label: "متن دکمه حالت خالی" },
];

interface SupportContactEditorProps {
  readonly jsonValue: Extract<JsonFormState, { kind: "supportContact" }>;
  readonly updateJson: UpdateJsonFormState;
}

interface SupportTextFieldsProps {
  readonly config: SupportContactForm;
  readonly fields: readonly TextFieldConfig<keyof SupportContactForm>[];
  readonly updateJson: UpdateJsonFormState;
}

const SupportTextFields = ({
  config,
  fields,
  updateJson,
}: SupportTextFieldsProps): ReactElement => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
    {fields.map((field) => (
      <TextField
        key={field.key}
        fullWidth
        multiline={field.multiline}
        minRows={field.multiline ? COMMON_TEXTAREA_ROWS : undefined}
        maxRows={field.multiline ? COMMON_TEXTAREA_ROWS : undefined}
        type={field.type ?? "text"}
        label={field.label}
        value={String(config[field.key] ?? "")}
        onChange={(event) =>
          updateJson((current) => {
            if (current.kind !== "supportContact") {
              return current;
            }
            return {
              ...current,
              config: { ...current.config, [field.key]: event.target.value },
            };
          })
        }
        sx={{ flexBasis: { md: field.multiline ? "100%" : "calc(50% - 8px)" } }}
      />
    ))}
  </Stack>
);

const SupportContactEditor = ({
  jsonValue,
  updateJson,
}: SupportContactEditorProps): ReactElement => {
  const config = jsonValue.config;

  return (
    <Stack spacing={2}>
      <Accordion defaultExpanded disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography fontWeight={900}>متن‌های اصلی صفحه پشتیبانی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SupportTextFields config={config} fields={supportMainFields} updateJson={updateJson} />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography fontWeight={900}>راه‌های ارتباطی</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SupportTextFields
            config={config}
            fields={supportChannelFields}
            updateJson={updateJson}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography fontWeight={900}>نکات سریع</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            {config.quickTips.map((tip, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <TextField
                  fullWidth
                  label={`نکته ${index + 1}`}
                  value={tip}
                  onChange={(event) =>
                    updateJson((current) => {
                      if (current.kind !== "supportContact") {
                        return current;
                      }
                      return {
                        ...current,
                        config: {
                          ...current.config,
                          quickTips: replaceAt(current.config.quickTips, index, event.target.value),
                        },
                      };
                    })
                  }
                />
                <IconButton
                  color="error"
                  onClick={() =>
                    updateJson((current) =>
                      current.kind === "supportContact"
                        ? {
                            ...current,
                            config: {
                              ...current.config,
                              quickTips: removeAt(
                                current.config.quickTips,
                                index,
                                createEmptyQuickTip()
                              ),
                            },
                          }
                        : current
                    )
                  }
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                updateJson((current) =>
                  current.kind === "supportContact"
                    ? {
                        ...current,
                        config: {
                          ...current.config,
                          quickTips: [...current.config.quickTips, createEmptyQuickTip()],
                        },
                      }
                    : current
                )
              }
            >
              افزودن نکته
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography fontWeight={900}>صفحه سوالات پرتکرار</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
              {faqPageFields.map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  multiline={field.multiline}
                  minRows={field.multiline ? COMMON_TEXTAREA_ROWS : undefined}
                  maxRows={field.multiline ? COMMON_TEXTAREA_ROWS : undefined}
                  label={field.label}
                  value={config.faqPage[field.key]}
                  onChange={(event) =>
                    updateJson((current) => {
                      if (current.kind !== "supportContact") {
                        return current;
                      }
                      return {
                        ...current,
                        config: {
                          ...current.config,
                          faqPage: {
                            ...current.config.faqPage,
                            [field.key]: event.target.value,
                          },
                        },
                      };
                    })
                  }
                  sx={{ flexBasis: { md: field.multiline ? "100%" : "calc(50% - 8px)" } }}
                />
              ))}
            </Stack>

            {config.faqPage.sections.map((section, sectionIndex) => (
              <Accordion key={sectionIndex} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                  <Typography fontWeight={800}>
                    {section.title || `دسته سوالات ${sectionIndex + 1}`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton
                        color="error"
                        onClick={() =>
                          updateJson((current) => {
                            if (current.kind !== "supportContact") {
                              return current;
                            }
                            return {
                              ...current,
                              config: {
                                ...current.config,
                                faqPage: {
                                  ...current.config.faqPage,
                                  sections: removeAt(
                                    current.config.faqPage.sections,
                                    sectionIndex,
                                    createEmptyFaqSection()
                                  ),
                                },
                              },
                            };
                          })
                        }
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>
                    {(
                      [
                        ["id", "شناسه دسته"],
                        ["title", "عنوان دسته"],
                        ["description", "توضیح دسته"],
                      ] as const
                    ).map(([field, label]) => (
                      <TextField
                        key={field}
                        fullWidth
                        multiline={field === "description"}
                        minRows={field === "description" ? MULTILINE_TEXTAREA_MIN_ROWS : undefined}
                        maxRows={field === "description" ? MULTILINE_TEXTAREA_MAX_ROWS : undefined}
                        label={label}
                        value={section[field]}
                        onChange={(event) =>
                          updateJson((current) => {
                            if (current.kind !== "supportContact") {
                              return current;
                            }
                            const nextSection = { ...section, [field]: event.target.value };
                            return {
                              ...current,
                              config: {
                                ...current.config,
                                faqPage: {
                                  ...current.config.faqPage,
                                  sections: replaceAt(
                                    current.config.faqPage.sections,
                                    sectionIndex,
                                    nextSection
                                  ),
                                },
                              },
                            };
                          })
                        }
                      />
                    ))}

                    {section.items.map((item, itemIndex) => (
                      <SectionPaper key={itemIndex}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={800}>سوال {itemIndex + 1}</Typography>
                          <IconButton
                            color="error"
                            onClick={() =>
                              updateJson((current) => {
                                if (current.kind !== "supportContact") {
                                  return current;
                                }
                                const nextSection: SupportFaqSectionForm = {
                                  ...section,
                                  items: removeAt(section.items, itemIndex, createEmptyFaqItem()),
                                };
                                return {
                                  ...current,
                                  config: {
                                    ...current.config,
                                    faqPage: {
                                      ...current.config.faqPage,
                                      sections: replaceAt(
                                        current.config.faqPage.sections,
                                        sectionIndex,
                                        nextSection
                                      ),
                                    },
                                  },
                                };
                              })
                            }
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </Stack>
                        {(
                          [
                            ["id", "شناسه سوال"],
                            ["question", "متن سوال"],
                            ["answer", "پاسخ", true],
                          ] as const
                        ).map(([field, label, multiline]) => (
                          <TextField
                            key={field}
                            fullWidth
                            multiline={Boolean(multiline)}
                            minRows={multiline ? COMMON_TEXTAREA_ROWS : undefined}
                            maxRows={multiline ? COMMON_TEXTAREA_ROWS : undefined}
                            label={label}
                            value={item[field]}
                            onChange={(event) =>
                              updateJson((current) => {
                                if (current.kind !== "supportContact") {
                                  return current;
                                }
                                const nextItem: SupportFaqItemForm = {
                                  ...item,
                                  [field]: event.target.value,
                                };
                                const nextSection: SupportFaqSectionForm = {
                                  ...section,
                                  items: replaceAt(section.items, itemIndex, nextItem),
                                };
                                return {
                                  ...current,
                                  config: {
                                    ...current.config,
                                    faqPage: {
                                      ...current.config.faqPage,
                                      sections: replaceAt(
                                        current.config.faqPage.sections,
                                        sectionIndex,
                                        nextSection
                                      ),
                                    },
                                  },
                                };
                              })
                            }
                          />
                        ))}
                      </SectionPaper>
                    ))}

                    <Button
                      variant="outlined"
                      startIcon={<AddRoundedIcon />}
                      onClick={() =>
                        updateJson((current) => {
                          if (current.kind !== "supportContact") {
                            return current;
                          }
                          const nextSection: SupportFaqSectionForm = {
                            ...section,
                            items: [...section.items, createEmptyFaqItem()],
                          };
                          return {
                            ...current,
                            config: {
                              ...current.config,
                              faqPage: {
                                ...current.config.faqPage,
                                sections: replaceAt(
                                  current.config.faqPage.sections,
                                  sectionIndex,
                                  nextSection
                                ),
                              },
                            },
                          };
                        })
                      }
                    >
                      افزودن سوال
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                updateJson((current) =>
                  current.kind === "supportContact"
                    ? {
                        ...current,
                        config: {
                          ...current.config,
                          faqPage: {
                            ...current.config.faqPage,
                            sections: [...current.config.faqPage.sections, createEmptyFaqSection()],
                          },
                        },
                      }
                    : current
                )
              }
            >
              افزودن دسته سوالات
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
};

export default SupportContactEditor;
