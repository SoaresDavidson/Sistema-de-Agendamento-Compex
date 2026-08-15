import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type {
	DiaSemana,
	HorarioCreate,
	HorarioLoteCreate,
	MedicoResponse,
} from "@/api/generated";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/Error";
import {
	createSchedule,
	createSchedulesBatch,
	getScheduleErrorMessage,
	listDoctors,
} from "../api/availableSchedulesApi";

type Mode = "individual" | "batch";

type IndividualForm = {
	medicoId: string;
	data: string;
	inicio: string;
	fim: string;
};

type PeriodoForm = {
	id: string;
	inicio: string;
	fim: string;
	duracaoMinutos: number;
};

type BatchForm = {
	medicoId: string;
	dataInicio: string;
	dataFim: string;
	diasSemana: DiaSemana[];
	periodos: PeriodoForm[];
};

type PreviewBlock = {
	date: string;
	start: string;
	end: string;
};

const WEEK_DAYS: Array<{ value: DiaSemana; label: string }> = [
	{ value: "SEGUNDA", label: "Segunda" },
	{ value: "TERCA", label: "Terça" },
	{ value: "QUARTA", label: "Quarta" },
	{ value: "QUINTA", label: "Quinta" },
	{ value: "SEXTA", label: "Sexta" },
	{ value: "SABADO", label: "Sábado" },
	{ value: "DOMINGO", label: "Domingo" },
];

const INITIAL_INDIVIDUAL: IndividualForm = {
	medicoId: "",
	data: "",
	inicio: "",
	fim: "",
};

const INITIAL_BATCH: BatchForm = {
	medicoId: "",
	dataInicio: "",
	dataFim: "",
	diasSemana: [],
	periodos: [{ id: "period-1", inicio: "", fim: "", duracaoMinutos: 30 }],
};

function toIsoDateTime(date: string, time: string) {
	return `${date}T${time}:00`;
}

function addDays(date: string) {
	const current = new Date(`${date}T00:00:00`);
	current.setDate(current.getDate() + 1);
	return current.toISOString().slice(0, 10);
}

function getWeekDay(date: string): DiaSemana {
	const day = new Date(`${date}T00:00:00`).getDay();
	return WEEK_DAYS[(day + 6) % 7].value;
}

function addMinutes(time: string, minutes: number) {
	const [hours, currentMinutes] = time.split(":").map(Number);
	const total = hours * 60 + currentMinutes + minutes;
	return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function getToday() {
	const current = new Date();
	return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
}

function buildPreview(form: BatchForm): PreviewBlock[] {
	const blocks: PreviewBlock[] = [];
	for (
		let date = form.dataInicio;
		date && date <= form.dataFim;
		date = addDays(date)
	) {
		if (!form.diasSemana.includes(getWeekDay(date))) continue;
		for (const periodo of form.periodos) {
			const duracao = periodo.duracaoMinutos;
			if (!duracao || duracao < 5 || !periodo.inicio || !periodo.fim) continue;
			for (
				let start = periodo.inicio;
				start < periodo.fim;
				start = addMinutes(start, duracao)
			) {
				const end = addMinutes(start, duracao);
				if (end > periodo.fim) break;
				blocks.push({ date, start, end });
			}
		}
	}
	return blocks;
}

function validateIndividual(form: IndividualForm) {
	if (!form.medicoId || !form.data || !form.inicio || !form.fim) {
		return "Preencha todos os campos obrigatórios.";
	}
	if (form.inicio >= form.fim) {
		return "O início deve ser anterior ao fim.";
	}
	return null;
}

function validateBatch(form: BatchForm) {
	if (!form.medicoId || !form.dataInicio || !form.dataFim) {
		return "Preencha todos os campos obrigatórios.";
	}
	if (form.dataInicio > form.dataFim) {
		return "A data inicial deve ser anterior ou igual à data final.";
	}
	if (form.diasSemana.length === 0) {
		return "Selecione pelo menos um dia da semana.";
	}
	if (form.periodos.some((periodo) => !periodo.inicio || !periodo.fim)) {
		return "Preencha o início e o fim de todos os períodos.";
	}
	if (form.periodos.some((periodo) => periodo.inicio >= periodo.fim)) {
		return "O início deve ser anterior ao fim em todos os períodos.";
	}
	if (
		form.periodos.some(
			(periodo) =>
				!Number.isInteger(periodo.duracaoMinutos) ||
				periodo.duracaoMinutos < 5,
		)
	) {
		return "A duração deve ser um número inteiro de pelo menos 5 minutos em todos os períodos.";
	}
	const periodosOrdenados = [...form.periodos].sort((a, b) =>
		a.inicio.localeCompare(b.inicio),
	);
	if (
		periodosOrdenados.some(
			(periodo, index) =>
				index > 0 && periodo.inicio < periodosOrdenados[index - 1].fim,
		)
	) {
		return "Os períodos não podem se sobrepor.";
	}
	if (buildPreview(form).length === 0) {
		return "Nenhum bloco pode ser gerado com os parâmetros informados.";
	}
	return null;
}

export function HorarioFormPage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<Mode>("individual");
	const [doctors, setDoctors] = useState<MedicoResponse[]>([]);
	const [loadingDoctors, setLoadingDoctors] = useState(true);
	const [doctorError, setDoctorError] = useState<string | null>(null);
	const [individual, setIndividual] = useState(INITIAL_INDIVIDUAL);
	const [batch, setBatch] = useState(INITIAL_BATCH);
	const [preview, setPreview] = useState<PreviewBlock[]>([]);
	const [formError, setFormError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [doctorRetryKey, setDoctorRetryKey] = useState(0);

	const currentDoctorId =
		mode === "batch" ? batch.medicoId : individual.medicoId;
	const selectedDoctor = useMemo(
		() => doctors.find((doctor) => doctor.id === currentDoctorId),
		[doctors, currentDoctorId],
	);
	const previewByDate = useMemo(() => {
		return preview.reduce<Map<string, PreviewBlock[]>>((groups, block) => {
			const blocks = groups.get(block.date) ?? [];
			groups.set(block.date, [...blocks, block]);
			return groups;
		}, new Map());
	}, [preview]);
	const today = getToday();

	useEffect(() => {
		void doctorRetryKey;
		let active = true;
		setLoadingDoctors(true);
		setDoctorError(null);
		void listDoctors()
			.then((result) => {
				if (active) setDoctors(result);
			})
			.catch((error: unknown) => {
				if (active) {
					setDoctorError(
						getScheduleErrorMessage(
							error,
							"Não foi possível carregar os médicos.",
						),
					);
				}
			})
			.finally(() => {
				if (active) setLoadingDoctors(false);
			});
		return () => {
			active = false;
		};
	}, [doctorRetryKey]);

	const clearFeedback = () => {
		setFormError(null);
		setSuccess(null);
	};

	const clearForm = () => {
		setIndividual(INITIAL_INDIVIDUAL);
		setBatch(INITIAL_BATCH);
		setPreview([]);
		clearFeedback();
	};

	const handleIndividualSubmit = async () => {
		clearFeedback();
		const validationError = validateIndividual(individual);
		if (validationError) {
			setFormError(validationError);
			return;
		}
		const payload: HorarioCreate = {
			medico_id: individual.medicoId,
			inicio: toIsoDateTime(individual.data, individual.inicio),
			fim: toIsoDateTime(individual.data, individual.fim),
		};
		setSubmitting(true);
		try {
			await createSchedule(payload);
			navigate("/horarios");
		} catch (error: unknown) {
			setFormError(
				getScheduleErrorMessage(
					error,
					"Não foi possível criar o horário. Revise os dados e tente novamente.",
				),
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handlePreview = () => {
		clearFeedback();
		const validationError = validateBatch(batch);
		if (validationError) {
			setPreview([]);
			setFormError(validationError);
			return;
		}
		setPreview(buildPreview(batch));
	};

	const handleBatchSubmit = async () => {
		clearFeedback();
		const validationError = validateBatch(batch);
		if (validationError) {
			setFormError(validationError);
			return;
		}
		setSubmitting(true);
		let totalCreated = 0;
		try {
			for (const periodo of batch.periodos) {
				const payload: HorarioLoteCreate = {
					medico_id: batch.medicoId,
					data_inicio: batch.dataInicio,
					data_fim: batch.dataFim,
					dias_semana: batch.diasSemana,
					inicio_periodo: periodo.inicio,
					fim_periodo: periodo.fim,
					duracao_minutos: periodo.duracaoMinutos,
				};
				const result = await createSchedulesBatch(payload);
				totalCreated += result.total_criados;
			}
			navigate("/horarios");
		} catch (error: unknown) {
			const message = getScheduleErrorMessage(
				error,
				"Não foi possível criar os horários. Revise os conflitos e tente novamente.",
			);
			setFormError(
				totalCreated > 0
					? `${totalCreated} horários foram criados antes deste conflito. ${message}`
					: message,
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (doctorError) {
		return (
			<section className="mx-auto max-w-5xl px-8 pt-12">
				<ErrorState
					message={doctorError}
					onRetry={() => setDoctorRetryKey((current) => current + 1)}
				/>
			</section>
		);
	}
	const hasDoctors = doctors.length > 0;

	return (
		<section>
			<header className="page-head mx-auto max-w-5xl px-8 pt-12 text-left">
				<div>
					<h1>Cadastrar horários</h1>
					<p>
						Crie um bloco individual ou gere vários blocos. Cada intervalo será
						validado pelo backend.
					</p>
				</div>
				<Link className="btn btn-secondary" to="/horarios">
					Voltar para horários
				</Link>
			</header>

			<div className="mx-auto max-w-5xl px-8">
				<section
					className="card schedule-form-card text-left"
					aria-labelledby="schedule-form-title"
				>
					<div className="card-head text-left">
						<div className="text-left">
							<h2 className="card-title text-left" id="schedule-form-title">
								Defina o horário de atendimento
							</h2>
							<p className="text-left">
								{mode === "batch"
									? "Configure o intervalo de datas, dias da semana e períodos de atendimento."
									: "Escolha uma data e o horário para cadastrar o atendimento."}
							</p>
						</div>
						<label className="mode-checkbox">
							<input
								type="checkbox"
								checked={mode === "batch"}
								onChange={(event) => {
									const isBatch = event.target.checked;
									setMode(isBatch ? "batch" : "individual");
									if (isBatch && individual.medicoId) {
										setBatch((prev) => ({
											...prev,
											medicoId: individual.medicoId,
										}));
									} else if (!isBatch && batch.medicoId) {
										setIndividual((prev) => ({
											...prev,
											medicoId: batch.medicoId,
										}));
									}
									clearFeedback();
								}}
							/>
							<span>Marcar vários horários de uma vez?</span>
						</label>
					</div>

					{loadingDoctors ? (
						<div className="notice" role="status">
							Carregando médicos...
						</div>
					) : (
						<>
							{!hasDoctors && (
								<div className="notice warning" role="status">
									<strong>Nenhum médico cadastrado</strong>
									<p>
										Cadastre um médico antes de criar horários de atendimento.
									</p>
								</div>
							)}
							{mode === "individual" && (
								<div
									id="individual-panel"
									role="tabpanel"
									className="grid gap-4"
								>
									<div className="form-grid form-grid-three">
										<div className="field span-3">
											<label className="required" htmlFor="schedule-doctor-new">
												Médico
											</label>
											<select
												id="schedule-doctor-new"
												className="select"
												value={individual.medicoId}
												disabled={!hasDoctors}
												onChange={(event) =>
													setIndividual({
														...individual,
														medicoId: event.target.value,
													})
												}
											>
												<option value="">Selecione</option>
												{doctors.map((doctor) => (
													<option key={doctor.id} value={doctor.id}>
														{doctor.nome}
													</option>
												))}
											</select>
											{selectedDoctor && (
												<span className="field-help">
													{selectedDoctor.especialidades
														.map((item) => item.nome)
														.join(", ")}
												</span>
											)}
										</div>
										<div className="field">
											<label className="required" htmlFor="schedule-date">
												Data
											</label>
											<input
												id="schedule-date"
												className="input"
												type="date"
												min={today}
												value={individual.data}
												onChange={(event) =>
													setIndividual({
														...individual,
														data: event.target.value,
													})
												}
											/>
										</div>
										<div className="field">
											<label className="required" htmlFor="start-time">
												Hora de início
											</label>
											<input
												id="start-time"
												className="input"
												type="time"
												value={individual.inicio}
												onChange={(event) =>
													setIndividual({
														...individual,
														inicio: event.target.value,
													})
												}
											/>
										</div>
										<div className="field">
											<label className="required" htmlFor="end-time">
												Hora de fim
											</label>
											<input
												id="end-time"
												className="input"
												type="time"
												value={individual.fim}
												onChange={(event) =>
													setIndividual({
														...individual,
														fim: event.target.value,
													})
												}
											/>
										</div>
									</div>
									{formError && (
										<div className="notice danger" role="alert">
											{formError}
										</div>
									)}
									{success && (
										<div className="notice success" role="status">
											{success}
										</div>
									)}
									<div className="form-actions">
										<Button
											variant="secondary"
											onClick={clearForm}
											disabled={submitting || !hasDoctors}
										>
											Limpar
										</Button>
										<Button
											onClick={handleIndividualSubmit}
											disabled={submitting || !hasDoctors}
										>
											{submitting ? "Criando..." : "Validar e criar"}
										</Button>
									</div>
								</div>
							)}

							{mode === "batch" && (
								<div id="batch-panel" role="tabpanel" className="grid gap-4">
									<div className="form-grid">
										<div className="field span-2">
											<label className="required" htmlFor="batch-doctor">
												Médico
											</label>
											<select
												id="batch-doctor"
												className="select"
												value={batch.medicoId}
												disabled={!hasDoctors}
												onChange={(event) =>
													setBatch({ ...batch, medicoId: event.target.value })
												}
											>
												<option value="">Selecione</option>
												{doctors.map((doctor) => (
													<option key={doctor.id} value={doctor.id}>
														{doctor.nome}
													</option>
												))}
											</select>
											{selectedDoctor && (
												<span className="field-help">
													{selectedDoctor.especialidades
														.map((item) => item.nome)
														.join(", ")}
												</span>
											)}
										</div>
										<div className="field">
											<label className="required" htmlFor="batch-start-date">
												Data inicial
											</label>
											<input
												id="batch-start-date"
												className="input"
												type="date"
												min={today}
												value={batch.dataInicio}
												onChange={(event) =>
													setBatch({ ...batch, dataInicio: event.target.value })
												}
											/>
										</div>
										<div className="field">
											<label className="required" htmlFor="batch-end-date">
												Data final
											</label>
											<input
												id="batch-end-date"
												className="input"
												type="date"
												min={batch.dataInicio || today}
												value={batch.dataFim}
												onChange={(event) =>
													setBatch({ ...batch, dataFim: event.target.value })
												}
											/>
										</div>
										<fieldset className="field span-2 days-field">
											<legend className="field-label">Dias da semana</legend>
											<div className="chips">
												{WEEK_DAYS.map((day) => (
													<label className="chip" key={day.value}>
														<input
															type="checkbox"
															checked={batch.diasSemana.includes(day.value)}
															onChange={(event) =>
																setBatch({
																	...batch,
																	diasSemana: event.target.checked
																		? [...batch.diasSemana, day.value]
																		: batch.diasSemana.filter(
																				(current) => current !== day.value,
																			),
																})
															}
														/>
														{day.label}
													</label>
												))}
											</div>
										</fieldset>
										<div className="periods-field span-2">
											<div className="section-heading">
												<span className="field-label">
													Períodos de atendimento
												</span>
												<p>
													Adicione um ou mais períodos no mesmo dia com a
													duração desejada.
												</p>
											</div>
											<div className="period-list">
												{batch.periodos.map((periodo, index) => (
													<div className="period-row" key={periodo.id}>
														<div className="field">
															<label
																className="required"
																htmlFor={`period-start-${index}`}
															>
																Início
															</label>
															<input
																id={`period-start-${index}`}
																className="input"
																type="time"
																value={periodo.inicio}
																onChange={(event) => {
																	const periodos = [...batch.periodos];
																	periodos[index] = {
																		...periodos[index],
																		inicio: event.target.value,
																	};
																	setBatch({ ...batch, periodos });
																}}
															/>
														</div>
														<div className="field">
															<label
																className="required"
																htmlFor={`period-end-${index}`}
															>
																Fim
															</label>
															<input
																id={`period-end-${index}`}
																className="input"
																type="time"
																value={periodo.fim}
																onChange={(event) => {
																	const periodos = [...batch.periodos];
																	periodos[index] = {
																		...periodos[index],
																		fim: event.target.value,
																	};
																	setBatch({ ...batch, periodos });
																}}
															/>
														</div>
														<div className="field period-duration-field">
															<label
																className="required"
																htmlFor={`period-duration-${index}`}
															>
																Duração (min)
															</label>
															<input
																id={`period-duration-${index}`}
																className="input"
																type="number"
																min={5}
																step={5}
																placeholder="Ex: 30"
																value={periodo.duracaoMinutos || ""}
																onChange={(event) => {
																	const val = parseInt(event.target.value, 10);
																	const periodos = [...batch.periodos];
																	periodos[index] = {
																		...periodos[index],
																		duracaoMinutos: isNaN(val) ? 0 : val,
																	};
																	setBatch({ ...batch, periodos });
																}}
															/>
														</div>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															className="btn-remove-period"
															disabled={batch.periodos.length === 1}
															aria-label={`Remover período ${index + 1}`}
															onClick={() =>
																setBatch({
																	...batch,
																	periodos: batch.periodos.filter(
																		(_, currentIndex) => currentIndex !== index,
																	),
																})
															}
														>
															Remover
														</Button>
													</div>
												))}
											</div>
											<button
												type="button"
												className="btn-add-period"
												onClick={() =>
													setBatch({
														...batch,
														periodos: [
															...batch.periodos,
															{
																id: crypto.randomUUID(),
																inicio: "",
																fim: "",
																duracaoMinutos:
																	batch.periodos[batch.periodos.length - 1]
																		?.duracaoMinutos || 30,
															},
														],
													})
												}
											>
												+ Adicionar período
											</button>
										</div>
									</div>

									{formError && (
										<div className="notice danger" role="alert">
											{formError}
										</div>
									)}
									{success && (
										<div className="notice success" role="status">
											{success}
										</div>
									)}

									<div className="form-actions">
										<Button
											variant="secondary"
											onClick={clearForm}
											disabled={submitting || !hasDoctors}
										>
											Limpar
										</Button>
										<Button
											onClick={handlePreview}
											disabled={submitting || !hasDoctors}
										>
											Gerar prévia
										</Button>
									</div>

									{preview.length > 0 && (
										<div className="batch-preview" aria-live="polite">
											<div className="preview-summary">
												<div>
													<strong>{preview.length} blocos na prévia</strong>
													<span>Distribuídos nos dias selecionados</span>
												</div>
												<span
													className="preview-summary-icon"
													aria-hidden="true"
												>
													✓
												</span>
											</div>
											<div className="notice">
												<p>
													Esta é uma prévia dos blocos. Sobreposições e
													disponibilidade serão confirmadas pelo backend ao
													criar. Cada período será processado separadamente.
												</p>
											</div>
											<div className="batch-preview-groups">
												{[...previewByDate.entries()].map(([date, blocks]) => (
													<div className="preview-date-group" key={date}>
														<div className="preview-date-heading">
															<strong>
																{new Intl.DateTimeFormat("pt-BR", {
																	weekday: "long",
																	day: "2-digit",
																	month: "2-digit",
																}).format(new Date(`${date}T00:00:00`))}
															</strong>
															<span>{blocks.length} blocos</span>
														</div>
														<div className="batch-preview-list">
															{blocks.map((block) => (
																<span
																	className="batch-block"
																	key={`${block.date}-${block.start}`}
																>
																	{block.start}–{block.end}
																</span>
															))}
														</div>
													</div>
												))}
											</div>
											<div className="form-actions">
												<Button
													variant="secondary"
													onClick={() => setPreview([])}
													disabled={submitting}
												>
													Ajustar parâmetros
												</Button>
												<Button
													onClick={handleBatchSubmit}
													disabled={submitting}
												>
													{submitting
														? "Criando..."
														: `Criar ${preview.length} horários`}
												</Button>
											</div>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</section>
			</div>
		</section>
	);
}
