	<label for="kostenstelle">Kostenstelle/Kostensammler</label>
	<select class="form-control" name="kostenstelle_id" id="kostenstelle">
		<option value="null"><?php echo $defaultOptionText ?? "Kostenstelle/Kostensammler wählen..." ?></option>
		<?php
		foreach ($kostenstellen as $kostenstelle):
			$selected = $selectedkostenstelle == $kostenstelle->kostenstelle_id ? ' selected' : '';
			$inactivetext = $kostenstelle->aktiv === false ? ' (inaktiv)' : '';
			$inactiveclass = $kostenstelle->aktiv === false ? ' class = "inactiveoption"' : '';
			if (is_numeric($kostenstelle->kostenstelle_id)):
			?>
				<option value="<?php echo $kostenstelle->kostenstelle_id; ?>"<?php echo $inactiveclass; ?><?php echo $selected; ?>>
					<?php echo $kostenstelle->bezeichnung.$inactivetext; ?>
				</option>
			<?php endif; ?>
		<?php endforeach; ?>
	</select>
