import { gql } from "@apollo/client";

export const BACKUP_RUN_MUTATION = gql`
  mutation BackupRun($input: BackupRunGqlInput!) {
    backupRun(input: $input) {
      items {
        target
        archiveFileName
        archiveFormat
        archivePartCount
        formattedArchiveSize
        durationMs
        createdAt
        telegramDelivered
        telegramMessageId
        telegramDeliveryNote
        collectionCount
        documentCount
        objectCount
        fileRecordCount
      }
    }
  }
`;
