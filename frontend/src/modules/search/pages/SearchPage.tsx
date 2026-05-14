import type { Metadata } from "next";
import { getSearchIndex } from "@tsarstva/data/server";
import SearchResults from "../components/SearchResults";

export const metadata: Metadata = {
  title: "Поиск — Чтение Царств с параллелями",
  description: "Поиск по тексту книг в читалке",
};

export default function SearchPage() {
  const verses = getSearchIndex();

  return <SearchResults verses={verses} />;
}
