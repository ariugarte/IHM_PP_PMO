import { Step, StepLabel, Stepper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function WorkflowStepper({ activeStep }: { activeStep: number }) {
  const { t } = useTranslation();
  return <Stepper activeStep={activeStep} alternativeLabel sx={{ maxWidth: 720, mx: 'auto', width: '100%' }}>
    {[t('stepSource'), t('stepDocuments'), t('stepResults')].map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
  </Stepper>;
}
