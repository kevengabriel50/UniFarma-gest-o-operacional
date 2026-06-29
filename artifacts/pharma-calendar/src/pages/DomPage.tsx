import AtendimentoModulePage from "@/components/atendimento/AtendimentoModulePage";
import {
  useListDomAtendimentos,
  useGetDomAtendimento,
  useCreateDomAtendimento,
  useUpdateDomAtendimento,
  useDeleteDomAtendimento,
  useFinalizeDomAtendimento,
  useReopenDomAtendimento,
  useAddDomItem,
  useDeleteDomItem,
  getListDomAtendimentosQueryKey,
  getGetDomAtendimentoQueryKey,
} from "@workspace/api-client-react";
import type { AtendimentoModuleHooks } from "@/components/atendimento/AtendimentoModulePage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const domHooks: AtendimentoModuleHooks = {
  useListAtendimentos: useListDomAtendimentos as any,
  useGetAtendimento: useGetDomAtendimento as any,
  useCreateAtendimento: useCreateDomAtendimento as any,
  useUpdateAtendimento: useUpdateDomAtendimento as any,
  useDeleteAtendimento: useDeleteDomAtendimento as any,
  useFinalizeAtendimento: useFinalizeDomAtendimento as any,
  useReopenAtendimento: useReopenDomAtendimento as any,
  useAddItem: useAddDomItem as any,
  useDeleteItem: useDeleteDomItem as any,
  listQueryKey: getListDomAtendimentosQueryKey,
  detailQueryKey: getGetDomAtendimentoQueryKey,
};

export default function DomPage() {
  return <AtendimentoModulePage moduleLabel="DOM" hooks={domHooks} />;
}
