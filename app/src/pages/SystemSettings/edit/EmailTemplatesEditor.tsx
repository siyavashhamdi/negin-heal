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

import type { JsonFormState, UpdateJsonFormState } from "./types";
import { HTML_TEXTAREA_ROWS, removeAt, replaceAt } from "./shared";
import { createEmptyEmailTemplate } from "./utils";

interface EmailTemplatesEditorProps {
  readonly jsonValue: Extract<JsonFormState, { kind: "emailTemplates" }>;
  readonly updateJson: UpdateJsonFormState;
}

const EmailTemplatesEditor = ({
  jsonValue,
  updateJson,
}: EmailTemplatesEditorProps): ReactElement => (
  <Stack spacing={2}>
    {jsonValue.templates.map((template, index) => (
      <Accordion key={index} defaultExpanded={index === 0} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Typography fontWeight={900}>{template.name || `قالب ایمیل ${index + 1}`}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="flex-end">
              <IconButton
                color="error"
                onClick={() =>
                  updateJson((current) =>
                    current.kind === "emailTemplates"
                      ? {
                          ...current,
                          templates: removeAt(current.templates, index, createEmptyEmailTemplate()),
                        }
                      : current
                  )
                }
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Stack>
            <TextField
              fullWidth
              label="نام قالب"
              value={template.name}
              onChange={(event) =>
                updateJson((current) => {
                  if (current.kind !== "emailTemplates") {
                    return current;
                  }
                  const nextTemplate = { ...template, name: event.target.value };
                  return {
                    ...current,
                    templates: replaceAt(current.templates, index, nextTemplate),
                  };
                })
              }
            />
            <TextField
              fullWidth
              label="موضوع ایمیل"
              value={template.subject}
              onChange={(event) =>
                updateJson((current) => {
                  if (current.kind !== "emailTemplates") {
                    return current;
                  }
                  const nextTemplate = { ...template, subject: event.target.value };
                  return {
                    ...current,
                    templates: replaceAt(current.templates, index, nextTemplate),
                  };
                })
              }
            />
            <TextField
              fullWidth
              multiline
              minRows={HTML_TEXTAREA_ROWS}
              maxRows={HTML_TEXTAREA_ROWS}
              label="HTML قالب"
              value={template.html}
              onChange={(event) =>
                updateJson((current) => {
                  if (current.kind !== "emailTemplates") {
                    return current;
                  }
                  const nextTemplate = { ...template, html: event.target.value };
                  return {
                    ...current,
                    templates: replaceAt(current.templates, index, nextTemplate),
                  };
                })
              }
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    ))}
    <Button
      variant="outlined"
      startIcon={<AddRoundedIcon />}
      onClick={() =>
        updateJson((current) =>
          current.kind === "emailTemplates"
            ? { ...current, templates: [...current.templates, createEmptyEmailTemplate()] }
            : current
        )
      }
    >
      افزودن قالب ایمیل
    </Button>
  </Stack>
);

export default EmailTemplatesEditor;
