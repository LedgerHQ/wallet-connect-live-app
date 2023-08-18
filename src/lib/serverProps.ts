import type { GetServerSideProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { getDefaultLanguage } from '@/helpers/generic'

export const getServerSideProps: GetServerSideProps = async ({
  query,
  locale,
  locales,
}) => ({
  props: {
    ...(await serverSideTranslations(
      getDefaultLanguage('en', locales, query.lang as string, locale),
    )),
  },
})
