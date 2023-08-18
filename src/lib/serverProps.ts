import { getDefaultLanguage } from "@/helpers/generic"
import { GetServerSideProps } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"

export const getServerSideProps: GetServerSideProps = async ({ query, locale, locales }) => ({
  props: {
    ...(await serverSideTranslations(
      getDefaultLanguage("en", locales, query.lang as string, locale),
    )),
  },
})
