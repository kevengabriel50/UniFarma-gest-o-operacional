import AtendimentoModulePage from "@/components/atendimento/AtendimentoModulePage";
import {
  useListContingenciaAtendimentos,
  useGetContingenciaAtendimento,
  useCreateContingenciaAtendimento,
  useUpdateContingenciaAtendimento,
  useDeleteContingenciaAtendimento,
  useFinalizeContingenciaAtendimento,
  useReopenContingenciaAtendimento,
  useAddContingenciaItem,
  useDeleteContingenciaItem,
  getListContingenciaAtendimentosQueryKey,
  getGetContingenciaAtendimentoQueryKey,
} from "@workspace/api-client-react";
import type { AtendimentoModuleHooks } from "@/components/atendimento/AtendimentoModulePage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contingenciaHooks: AtendimentoModuleHooks = {
  useListAtendimentos: useListContingenciaAtendimentos as any,
  useGetAtendimento: useGetContingenciaAtendimento as any,
  useCreateAtendimento: useCreateContingenciaAtendimento as any,
  useUpdateAtendimento: useUpdateContingenciaAtendimento as any,
  useDeleteAtendimento: useDeleteContingenciaAtendimento as any,
  useFinalizeAtendimento: useFinalizeContingenciaAtendimento as any,
  useReopenAtendimento: useReopenContingenciaAtendimento as any,
  useAddItem: useAddContingenciaItem as any,
  useDeleteItem: useDeleteContingenciaItem as any,
  listQueryKey: getListContingenciaAtendimentosQueryKey,
  detailQueryKey: getGetContingenciaAtendimentoQueryKey,
};

export default function ContingenciaPage() {
  return <AtendimentoModulePage moduleLabel="Contingência" hooks={contingenciaHooks} />;
}
