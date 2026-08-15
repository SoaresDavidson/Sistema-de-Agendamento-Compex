import { useMemo } from "react";
import type { EspecialidadeResponse, MedicoResponse } from "@/api/generated";

interface ScheduleFiltersCardProps {
	specialties: EspecialidadeResponse[];
	doctors: MedicoResponse[];
	selectedSpecialtyId: string;
	selectedDoctorId: string;
	selectedDate: string;
	onSpecialtyChange: (specialtyId: string) => void;
	onDoctorChange: (doctorId: string) => void;
	onDateChange: (date: string) => void;
	minDate: string;
}

export function ScheduleFiltersCard({
	specialties,
	doctors,
	selectedSpecialtyId,
	selectedDoctorId,
	selectedDate,
	onSpecialtyChange,
	onDoctorChange,
	onDateChange,
	minDate,
}: ScheduleFiltersCardProps) {
	const filteredDoctors = useMemo(() => {
		if (!selectedSpecialtyId) return doctors;
		return doctors.filter((doctor) =>
			doctor.especialidades.some(
				(specialty) => specialty.id === selectedSpecialtyId,
			),
		);
	}, [doctors, selectedSpecialtyId]);

	return (
		<article className="card text-left" data-od-id="card-refine-agenda">
			<div className="card-head">
				<div>
					<h2 className="card-title">2. Refine a agenda</h2>
					<p>
						A especialidade filtra os médicos; não será duplicada no
						agendamento.
					</p>
				</div>
			</div>

			<div className="form-grid">
				<div className="field">
					<label htmlFor="new-specialty">Especialidade</label>
					<select
						className="select"
						id="new-specialty"
						value={selectedSpecialtyId}
						onChange={(e) => onSpecialtyChange(e.target.value)}
					>
						<option value="">Todas as especialidades</option>
						{specialties.map((spec) => (
							<option key={spec.id} value={spec.id}>
								{spec.nome}
							</option>
						))}
					</select>
				</div>

				<div className="field">
					<label htmlFor="new-doctor">Médico</label>
					<select
						className="select"
						id="new-doctor"
						value={selectedDoctorId}
						onChange={(e) => onDoctorChange(e.target.value)}
					>
						<option value="">Todos os médicos</option>
						{filteredDoctors.map((doc) => (
							<option key={doc.id} value={doc.id}>
								{doc.nome}
							</option>
						))}
					</select>
				</div>

				<div className="field span-2">
					<label htmlFor="new-date">Data</label>
					<input
						className="input"
						id="new-date"
						type="date"
						min={minDate}
						value={selectedDate}
						onChange={(e) => onDateChange(e.target.value)}
					/>
				</div>
			</div>
		</article>
	);
}
